package services

import (
	"encoding/json"
	"fmt"
	"log"
	"sync"
	"time"

	"github.com/bwmarrin/discordgo"
	"github.com/go-redis/redis"
	"github.com/google/uuid"
	"github.com/hazebio/haze.bio_backend/models"
	"gorm.io/gorm"
)

type EventHandler func(event *models.Event) error

type EventService struct {
	DB          *gorm.DB
	Client      *redis.Client
	BotSession  *discordgo.Session
	handlers    map[models.EventType][]EventHandler
	handlersMux sync.RWMutex
	pubSubChan  *redis.PubSub
}

func NewEventService(db *gorm.DB, client *redis.Client, botSession *discordgo.Session) *EventService {
	es := &EventService{
		DB:         db,
		Client:     client,
		BotSession: botSession,
		handlers:   make(map[models.EventType][]EventHandler),
	}

	db.AutoMigrate(&models.Event{}, &models.EventSubscription{})

	es.pubSubChan = es.Client.Subscribe("events")

	go es.listenForEvents()

	return es
}

func (es *EventService) listenForEvents() {
	for {
		msg, err := es.pubSubChan.ReceiveMessage()
		if err != nil {
			log.Printf("Error receiving message from Redis: %v", err)
			time.Sleep(time.Second)
			continue
		}

		var event models.Event
		if err := json.Unmarshal([]byte(msg.Payload), &event); err != nil {
			log.Printf("Error unmarshaling event: %v", err)
			continue
		}

		es.processEvent(&event)
	}
}

func (es *EventService) Publish(eventType models.EventType, data interface{}) (*models.Event, error) {
	var eventData models.EventData
	if d, ok := data.(models.EventData); ok {
		eventData = d
	} else {
		bytes, err := json.Marshal(data)
		if err != nil {
			return nil, fmt.Errorf("error marshaling event data: %w", err)
		}

		if err := json.Unmarshal(bytes, &eventData); err != nil {
			return nil, fmt.Errorf("error converting to EventData: %w", err)
		}
	}

	event := &models.Event{
		ID:        uuid.New().String(),
		Type:      eventType,
		Data:      eventData,
		CreatedAt: time.Now(),
	}

	if err := es.DB.Create(event).Error; err != nil {
		return nil, fmt.Errorf("error saving event to database: %w", err)
	}

	eventJSON, err := json.Marshal(event)
	if err != nil {
		return event, fmt.Errorf("error marshaling event for Redis: %w", err)
	}

	if err := es.Client.Publish("events", string(eventJSON)).Err(); err != nil {
		return event, fmt.Errorf("error publishing event to Redis: %w", err)
	}

	go es.processEvent(event)

	return event, nil
}

func (es *EventService) PublishUserRegistration(user *models.User) (*models.Event, error) {
	data := models.UserRegistrationData{
		UID:      user.UID,
		Username: user.Username,
	}

	return es.Publish(models.EventUserRegistered, data)
}

func (es *EventService) Subscribe(eventType models.EventType, handler EventHandler) {
	es.handlersMux.Lock()
	defer es.handlersMux.Unlock()

	es.handlers[eventType] = append(es.handlers[eventType], handler)
	log.Printf("Registered handler for event type: %s", eventType)
}

func (es *EventService) SubscribeMany(eventTypes []models.EventType, handler EventHandler) {
	for _, eventType := range eventTypes {
		es.Subscribe(eventType, handler)
	}
}

func (es *EventService) Unsubscribe(eventType models.EventType, handler EventHandler) {
	es.handlersMux.Lock()
	defer es.handlersMux.Unlock()

	handlers := es.handlers[eventType]
	for i, h := range handlers {
		if fmt.Sprintf("%p", h) == fmt.Sprintf("%p", handler) {
			es.handlers[eventType] = append(handlers[:i], handlers[i+1:]...)
			break
		}
	}
}

func (es *EventService) processEvent(event *models.Event) {
	es.handlersMux.RLock()
	handlers := es.handlers[event.Type]
	es.handlersMux.RUnlock()

	for _, handler := range handlers {
		go func(h EventHandler) {
			defer func() {
				if r := recover(); r != nil {
					log.Printf("PANIC in event handler for %s: %v", event.Type, r)
				}
			}()

			if err := h(event); err != nil {
				log.Printf("Error handling event %s: %v", event.Type, err)
			}
		}(handler)
	}
}

// MarkEventProcessed marks an event as processed
func (es *EventService) MarkEventProcessed(eventID string) error {
	now := time.Now()
	return es.DB.Model(&models.Event{}).
		Where("id = ?", eventID).
		Updates(map[string]interface{}{
			"processed":    true,
			"processed_at": now,
		}).Error
}

// GetUnprocessedEvents retrieves unprocessed events of specific types
func (es *EventService) GetUnprocessedEvents(eventTypes ...models.EventType) ([]*models.Event, error) {
	var events []*models.Event
	query := es.DB.Where("processed = ?", false)

	if len(eventTypes) > 0 {
		query = query.Where("type IN ?", eventTypes)
	}

	if err := query.Find(&events).Error; err != nil {
		return nil, fmt.Errorf("error retrieving unprocessed events: %w", err)
	}

	return events, nil
}

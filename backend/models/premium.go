package models

type PremiumFeatures struct {
	Widgets              map[string]bool
	UsernameEffects      map[string]bool
	Fonts                map[string]bool
	Templates            map[string]bool
	CursorEffects        map[string]bool
	LayoutMaxWidth       bool
	AllowHTMLDescription bool
	ParallaxEffect       bool
}

func NewPremiumFeatures() *PremiumFeatures {
	return &PremiumFeatures{
		Widgets: map[string]bool{},
		UsernameEffects: map[string]bool{
			"hacker": true,
		},
		Fonts: map[string]bool{
			"grand-theft-auto": true,
		},
		Templates: map[string]bool{
			"modern":       true,
			"minimalistic": true,
		},
		CursorEffects: map[string]bool{
			"bubble":    true,
			"snowflake": true,
		},
		LayoutMaxWidth:       true,
		AllowHTMLDescription: true,
		ParallaxEffect:       true,
	}
}

func (pf *PremiumFeatures) IsParallaxEffectPremium() bool {
	return pf.ParallaxEffect
}

func (pf *PremiumFeatures) IsWidgetPremium(widgetType string) bool {
	return pf.Widgets[widgetType]
}

func (pf *PremiumFeatures) IsUsernameEffectPremium(effect string) bool {
	return pf.UsernameEffects[effect]
}

func (pf *PremiumFeatures) IsFontPremium(font string) bool {
	return pf.Fonts[font]
}

func (pf *PremiumFeatures) IsTemplatePremium(template string) bool {
	return pf.Templates[template]
}

func (pf *PremiumFeatures) IsCursorEffectPremium(effect string) bool {
	return pf.CursorEffects[effect]
}

func (pf *PremiumFeatures) IsLayoutMaxWidthPremium() bool {
	return pf.LayoutMaxWidth
}

func (pf *PremiumFeatures) IsAllowHTMLDescriptionPremium() bool {
	return pf.AllowHTMLDescription
}

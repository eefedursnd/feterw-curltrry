package utils

import (
	"errors"

	"github.com/jackc/pgx/v5/pgconn"
)

const (
	ErrDuplicateKey = "23505"
)

func IsError(err error, code string) bool {
	var pgErr *pgconn.PgError
	if errors.As(err, &pgErr) && pgErr.Code == code {
		return true
	}
	return false
}

package utils

import (
	"crypto/rand"
	"encoding/hex"
)

func RandomToken(length int) string {
	b := make([]byte, length)
	_, _ = rand.Read(b)
	return hex.EncodeToString(b)
}

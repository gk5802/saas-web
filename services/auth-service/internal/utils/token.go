package utils

import (
	"crypto/rand"
	"encoding/hex"
)

func RandomToken(n int) string {
	b := make([]byte, n)
	_, _ = rand.Read(b)
	return hex.EncodeToString(b)
}

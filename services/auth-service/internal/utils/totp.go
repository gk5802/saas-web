package utils

import (
	"crypto/hmac"
	"crypto/sha1"
	"encoding/base32"
	"encoding/binary"
	"fmt"
	"strings"
	"time"
)

// हिन्दी: dependency-फ्री TOTP (RFC 6238) — Google Authenticator compatible

func GenBase32Secret(n int) (string, error) {
	tok, err := RandomToken(n)
	if err != nil { return "", err }
	// base32 secret (upper, no padding)
	return strings.TrimRight(base32.StdEncoding.WithPadding(base32.NoPadding).EncodeToString([]byte(tok)), "="), nil
}

func hotp(secret []byte, counter uint64) uint32 {
	mac := hmac.New(sha1.New, secret)
	var buf [8]byte
	binary.BigEndian.PutUint64(buf[:], counter)
	mac.Write(buf[:])
	sum := mac.Sum(nil)
	offset := sum[len(sum)-1] & 0x0f
	code := (uint32(sum[offset])&0x7f)<<24 |
		(uint32(sum[offset+1])&0xff)<<16 |
		(uint32(sum[offset+2])&0xff)<<8 |
		(uint32(sum[offset+3])&0xff)
	return code % 1000000
}

func TOTPNow(secretBase32 string, period int) (string, error) {
	if period <= 0 { period = 30 }
	key, err := base32.StdEncoding.WithPadding(base32.NoPadding).DecodeString(strings.ToUpper(secretBase32))
	if err != nil { return "", err }
	counter := uint64(time.Now().Unix() / int64(period))
	code := hotp(key, counter)
	return fmt.Sprintf("%06d", code), nil
}

func VerifyTOTP(secretBase32, code string, period int, window int) bool {
	// window = ±steps allow
	if period <= 0 { period = 30 }
	key, err := base32.StdEncoding.WithPadding(base32.NoPadding).DecodeString(strings.ToUpper(secretBase32))
	if err != nil { return false }
	nowCtr := int64(time.Now().Unix() / int64(period))
	for i := -window; i <= window; i++ {
		c := hotp(key, uint64(nowCtr+int64(i)))
		if fmt.Sprintf("%06d", c) == code {
			return true
		}
	}
	return false
}

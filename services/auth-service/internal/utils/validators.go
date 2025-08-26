package utils

import "regexp"

// हिन्दी: basic validators (email/password) — जरूरत पड़े तो और स्ट्रिक्ट करें

var emailRe = regexp.MustCompile(`^[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}$`)

func IsEmail(s string) bool {
	return emailRe.MatchString(s)
}

func StrongPassword(p string) bool {
	return len(p) >= 8
}

package models

import "time"

// Session token (opaque) — docstore में save, revoke आसान
type Session struct {
	Token     string    `json:"token"`
	UserID    string    `json:"userId"`
	Role      string    `json:"role"`
	ExpiresAt time.Time `json:"expiresAt"`
	CreatedAt time.Time `json:"createdAt"`
}

// Temp2FA (login के बाद OTP verify तक अस्थायी state)
type Temp2FA struct {
	ID        string    `json:"id"`     // tempId
	UserID    string    `json:"userId"`
	ExpiresAt time.Time `json:"expiresAt"`
}

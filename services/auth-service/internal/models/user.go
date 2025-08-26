package models

import "time"

// User model (🔒 auth + 2FA + verification)
type User struct {
	ID              string    `json:"id"`
	Email           string    `json:"email"`
	PasswordHash    string    `json:"passwordHash"`
	Role            string    `json:"role"` // "player" | "manager" | "admin" | "super-admin"
	Verified        bool      `json:"verified"`
	TwoFAEnabled    bool      `json:"twoFAEnabled"`
	TwoFASecretEnc  string    `json:"twoFASecretEnc"` // encrypted base32 (utils.Crypto)
	CreatedAt       time.Time `json:"createdAt"`
	UpdatedAt       time.Time `json:"updatedAt"`
	// Email verification
	VerifyToken     string    `json:"verifyToken"`
	VerifyIssuedAt  time.Time `json:"verifyIssuedAt"`
	VerificationToken string `json:"verification_token,omitempty"`
}

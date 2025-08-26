package handlers

import (
	"encoding/json"
	"net/http"
	"strings"
	"time"

	"wkt3.com/auth-service/internal/storage"
)

func Me(w http.ResponseWriter, r *http.Request) {
	h := r.Header.Get("Authorization")
	if !strings.HasPrefix(h, "Bearer ") { http.Error(w, "unauthorized", http.StatusUnauthorized); return }
	token := strings.TrimPrefix(h, "Bearer ")
	s, err := storage.GetSession(token); if err != nil { http.Error(w, "unauthorized", http.StatusUnauthorized); return }
	if time.Now().After(s.ExpiresAt) { _ = storage.DeleteSession(token); http.Error(w, "expired", http.StatusUnauthorized); return }
	u, err := storage.FindUserByID(s.UserID); if err != nil { http.Error(w, "user not found", http.StatusNotFound); return }
	_ = json.NewEncoder(w).Encode(map[string]any{
		"success": true,
		"user": map[string]any{
			"id": u.ID, "email": u.Email, "role": u.Role, "verified": u.Verified, "twoFAEnabled": u.TwoFAEnabled,
		},
	})
}

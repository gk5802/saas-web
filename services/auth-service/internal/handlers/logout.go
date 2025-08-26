package handlers

import (
	"encoding/json"
	"net/http"
	"strings"

	"wkt3.com/auth-service/internal/storage"
)

func Logout(w http.ResponseWriter, r *http.Request) {
	h := r.Header.Get("Authorization")
	if !strings.HasPrefix(h, "Bearer ") { http.Error(w, "unauthorized", http.StatusUnauthorized); return }
	token := strings.TrimPrefix(h, "Bearer ")
	_ = storage.DeleteSession(token)
	_ = json.NewEncoder(w).Encode(map[string]any{"success": true, "message":"logged out"})
}

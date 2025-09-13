package middleware

import (
	"encoding/json"
	"net/http"
	"strings"
	"wkt3.com/auth-service/internal/storage"
)

// AuthMiddleware → har protected route pe token check karega
func AuthMiddleware(store *storage.MemoryStore, next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Token header se nikalo
		authHeader := r.Header.Get("Authorization")
		if authHeader == "" || !strings.HasPrefix(authHeader, "Bearer ") {
			http.Error(w, "missing or invalid token", http.StatusUnauthorized)
			return
		}

		token := strings.TrimPrefix(authHeader, "Bearer ")

		// Check session store
		sessions := store.GetByField("sessions", "token", token)
		if len(sessions) == 0 {
			http.Error(w, "invalid or expired session", http.StatusUnauthorized)
			return
		}

		// Agar sab sahi hai → request ko aage bhejo
		next.ServeHTTP(w, r)
	})
}

// ✅ Utility response for testing protected routes
func ProtectedHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]any{
		"success": true,
		"message": "You are inside a protected route!",
	})
}

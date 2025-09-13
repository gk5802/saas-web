package middleware

import (
	"net/http"
	"time"

"wkt3.com/auth-service/internal/storage"
)

// SessionMiddleware check करता है कि request के साथ valid session token है या नहीं
func SessionMiddleware(store *storage.MemoryStore, next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		token := r.Header.Get("Authorization")
		if token == "" {
			http.Error(w, "missing token", http.StatusUnauthorized)
			return
		}

		session, ok := store.Get("sessions", token)
		if !ok {
			http.Error(w, "invalid session", http.StatusUnauthorized)
			return
		}

		// expiry check
		exp, ok := session["expiry"].(time.Time)
		if !ok || time.Now().After(exp) {
			store.Delete("sessions", token) // expired token हटाओ
			http.Error(w, "session expired", http.StatusUnauthorized)
			return
		}

		// ✅ आगे पास करो
		next.ServeHTTP(w, r)
	})
}

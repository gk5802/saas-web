package middleware

import (
	"net/http"
	"strings"
	"time"

	"wkt3.com/auth-service/internal/storage"
)

// हिन्दी: Authorization: Bearer <token> से session validate

func Auth(next http.HandlerFunc) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		h := r.Header.Get("Authorization")
		if h == "" || !strings.HasPrefix(h, "Bearer ") {
			http.Error(w, "Unauthorized", http.StatusUnauthorized)
			return
		}
		token := strings.TrimPrefix(h, "Bearer ")
		sess, err := storage.GetSession(token)
		if err != nil || sess == nil {
			http.Error(w, "Unauthorized", http.StatusUnauthorized)
			return
		}
		if time.Now().After(sess.ExpiresAt) {
			_ = storage.DeleteSession(token)
			http.Error(w, "Session expired", http.StatusUnauthorized)
			return
		}
		// (optional) context में userId डालना हो तो यहाँ करें
		next.ServeHTTP(w, r)
	})
}

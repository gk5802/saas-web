package middleware

import (
	"net"
	"net/http"
	"sync"
	"time"
)

// हिन्दी: simple in-memory rate limit (dev only)
var rl = struct{
	mu sync.Mutex
	h  map[string][]time.Time
}{h: map[string][]time.Time{}}

const limit = 10
var window = 1 * time.Minute

func clientIP(r *http.Request) string {
	ip, _, _ := net.SplitHostPort(r.RemoteAddr)
	if ip == "" { ip = r.RemoteAddr }
	return ip
}

func RateLimit(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		ip := clientIP(r)
		now := time.Now()

		rl.mu.Lock()
		defer rl.mu.Unlock()
		h := rl.h[ip]
		out := h[:0]
		for _, t := range h {
			if now.Sub(t) < window { out = append(out, t) }
		}
		if len(out) >= limit {
			http.Error(w, "Too many requests", http.StatusTooManyRequests)
			return
		}
		out = append(out, now)
		rl.h[ip] = out

		next.ServeHTTP(w, r)
	}
}

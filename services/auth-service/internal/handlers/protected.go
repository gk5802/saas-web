package handlers

import (
	"encoding/json"
	"net/http"
)

// सिर्फ test के लिए एक protected route
func ProtectedHandler(w http.ResponseWriter, r *http.Request) {
	resp := map[string]any{
		"success": true,
		"message": "You are inside a protected route ✅",
	}
	_ = json.NewEncoder(w).Encode(resp)
}

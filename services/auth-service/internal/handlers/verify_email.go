package handlers

import (
	"wkt3.com/auth-service/internal/storage"
	"encoding/json"
	"net/http"
)

func VerifyEmailHandler(store *storage.MemoryStore) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var body struct {
			Email string `json:"email"`
		}
		if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
			http.Error(w, "invalid request", http.StatusBadRequest)
			return
		}

		// user खोजो
		user, found := store.FindByField("users", "email", body.Email)
		if !found {
			http.Error(w, "user not found", http.StatusNotFound)
			return
		}

		// verify set करो
		user["verified"] = true
		store.Update("users", user["id"].(string), user)

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]any{
			"success": true,
			"message": "email verified successfully",
		})
	}
}

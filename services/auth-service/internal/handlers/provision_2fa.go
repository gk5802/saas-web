package handlers

import (
	"encoding/json"
	"net/http"


	"wkt3.com/auth-service/internal/storage"
	"wkt3.com/auth-service/internal/utils"
)

// हिन्दी: logged-in user अपने लिए 2FA secret generate करेगा (yet not enabled)
// Frontend इसे QR/otpauth से दिखाएगा; enable तभी होगा जब user OTP verify करेगा

func Provision2FA(w http.ResponseWriter, r *http.Request) {
	// यहाँ simple path: client पहले /me से userId लेगा, फिर इस endpoint पर call।
	// Production में session से user निकालकर enforce करें (Auth middleware context).
	// Demo: body में userId लें (या header से) — पर अभी simple:

	userId := r.URL.Query().Get("userId")
	if userId == "" { http.Error(w, "missing userId", http.StatusBadRequest); return }

	u, err := storage.FindUserByID(userId)
	if err != nil { http.Error(w, "user not found", http.StatusNotFound); return }

	secret, err := utils.GenBase32Secret(20)
	if err != nil { http.Error(w, "secret gen fail", http.StatusInternalServerError); return }
	// अभी enable नहीं — temporary secret client को दें (frontend QR बनाए)
	otpauth := "otpauth://totp/WKT3:" + u.Email + "?secret=" + secret + "&issuer=WKT3&algorithm=SHA1&digits=6&period=30"

	_ = json.NewEncoder(w).Encode(map[string]any{"success": true, "secret": secret, "otpauth": otpauth})
}

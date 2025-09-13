package storage

import (
	"crypto/rand"
	"encoding/hex"
	"errors"
	"sync"
	"time"
)

// MemoryStore: simple in-memory document store
type MemoryStore struct {
	Mu   sync.RWMutex
	Data map[string]map[string]map[string]any
}

func NewMemoryStore() *MemoryStore {
	return &MemoryStore{
		Data: make(map[string]map[string]map[string]any),
	}
}

func randHex(n int) string {
	b := make([]byte, n)
	_, _ = rand.Read(b)
	return hex.EncodeToString(b)
}

// Insert नया document insert करता है
func (s *MemoryStore) Insert(collection string, doc map[string]any) string {
	s.Mu.Lock()
	defer s.Mu.Unlock()

	if _, ok := s.Data[collection]; !ok {
		s.Data[collection] = make(map[string]map[string]any)
	}
	id := doc["id"].(string)
	s.Data[collection][id] = doc
	return id
}

// FindByField finds the *first* document in a collection where doc[field] == value.
// Returns (doc, true) if found, otherwise (nil, false).
func (s *MemoryStore) FindByField(collection, field string, value any) (map[string]any, bool) {
	s.Mu.RLock()
	defer s.Mu.RUnlock()

	rows, ok := s.Data[collection]
	if !ok {
		return nil, false
	}
	for _, doc := range rows {
		if v, has := doc[field]; has && v == value {
			return doc, true
		}
	}
	return nil, false
}

// GetByField is kept as a backward-compatible alias to FindByField
func (s *MemoryStore) GetByField(collection, field string, value any) (map[string]any, bool) {
	return s.FindByField(collection, field, value)
}

// DeleteByField removes documents where doc[field] == value.
// It removes **all matching documents** and returns number removed.
func (s *MemoryStore) DeleteByField(collection, field string, value any) int {
	s.Mu.Lock()
	defer s.Mu.Unlock()

	rows, ok := s.Data[collection]
	if !ok || len(rows) == 0 {
		return 0
	}
	newRows := make(map[string]map[string]any, len(rows))
	removed := 0
	for id, doc := range rows {
		if v, has := doc[field]; has && v == value {
			removed++
			continue
		}
		newRows[id] = doc
	}
	s.Data[collection] = newRows
	return removed
}

// Update replaces a document by its id (if exists). Returns error if not found.
func (s *MemoryStore) Update(collection, id string, newDoc map[string]any) error {
	s.Mu.Lock()
	defer s.Mu.Unlock()

	rows, ok := s.Data[collection]
	if !ok {
		return errors.New("collection not found")
	}
	for i, d := range rows {
		if idv, has := d["id"]; has && idv == id {
			s.Data[collection][i] = newDoc
			return nil
		}
	}
	return errors.New("document not found")
}

// GetAll returns a shallow copy of collection rows (for debug)
func (s *MemoryStore) GetAll(collection string) []map[string]any {
	s.Mu.RLock()
	defer s.Mu.RUnlock()
	rows := s.Data[collection]
	out := make([]map[string]any, 0, len(rows))
	for _, doc := range rows {
		out = append(out, doc)
	}
	return out
}
// ✅ Get: किसी collection से id के आधार पर doc fetch
func (s *MemoryStore) Get(collection, id string) (map[string]any, bool) {
	s.Mu.RLock()
	defer s.Mu.RUnlock()

	col, ok := s.Data[collection]
	if !ok {
		return nil, false
	}
	doc, ok := col[id]
	return doc, ok
}

// ✅ Delete: किसी collection से id के आधार पर doc delete
func (s *MemoryStore) Delete(collection, id string) bool {
	s.Mu.Lock()
	defer s.Mu.Unlock()

	col, ok := s.Data[collection]
	if !ok {
		return false
	}
	if _, exists := col[id]; !exists {
		return false
	}
	delete(col, id)
	return true
}

// Expired sessions cleanup (optional utility)
func (s *MemoryStore) CleanupExpiredSessions() {
	s.Mu.Lock()
	defer s.Mu.Unlock()

	sessions, ok := s.Data["sessions"]
	if !ok {
		return
	}
	now := time.Now()
	for id, session := range sessions {
		if exp, ok := session["expiry"].(time.Time); ok && now.After(exp) {
			delete(sessions, id)
		}
	}
}
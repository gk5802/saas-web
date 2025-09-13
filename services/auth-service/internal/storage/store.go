package storage

import (
	"crypto/rand"
	"encoding/hex"
	"errors"
	"sync"
)

// MemoryStore: simple in-memory document store
type MemoryStore struct {
	mu   sync.RWMutex
	data map[string][]map[string]any
}

func NewMemoryStore() *MemoryStore {
	return &MemoryStore{
		data: make(map[string][]map[string]any),
	}
}

func randHex(n int) string {
	b := make([]byte, n)
	_, _ = rand.Read(b)
	return hex.EncodeToString(b)
}

// Insert inserts a document into a collection. If doc has no "id", it auto-generates one.
func (s *MemoryStore) Insert(collection string, doc map[string]any) {
	s.mu.Lock()
	defer s.mu.Unlock()

	if _, ok := doc["id"]; !ok {
		doc["id"] = randHex(8)
	}
	s.data[collection] = append(s.data[collection], doc)
}

// FindByField finds the *first* document in a collection where doc[field] == value.
// Returns (doc, true) if found, otherwise (nil, false).
func (s *MemoryStore) FindByField(collection, field string, value any) (map[string]any, bool) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	rows, ok := s.data[collection]
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
	s.mu.Lock()
	defer s.mu.Unlock()

	rows, ok := s.data[collection]
	if !ok || len(rows) == 0 {
		return 0
	}
	newRows := make([]map[string]any, 0, len(rows))
	removed := 0
	for _, doc := range rows {
		if v, has := doc[field]; has && v == value {
			removed++
			continue
		}
		newRows = append(newRows, doc)
	}
	s.data[collection] = newRows
	return removed
}

// Update replaces a document by its id (if exists). Returns error if not found.
func (s *MemoryStore) Update(collection, id string, newDoc map[string]any) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	rows, ok := s.data[collection]
	if !ok {
		return errors.New("collection not found")
	}
	for i, d := range rows {
		if idv, has := d["id"]; has && idv == id {
			s.data[collection][i] = newDoc
			return nil
		}
	}
	return errors.New("document not found")
}

// GetAll returns a shallow copy of collection rows (for debug)
func (s *MemoryStore) GetAll(collection string) []map[string]any {
	s.mu.RLock()
	defer s.mu.RUnlock()
	rows := s.data[collection]
	out := make([]map[string]any, len(rows))
	copy(out, rows)
	return out
}

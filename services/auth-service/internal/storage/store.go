package storage

import (
	"sync"
)

type MemoryStore struct {
	mu   sync.RWMutex
	data map[string][]map[string]any
}

func NewMemoryStore() *MemoryStore {
	return &MemoryStore{
		data: make(map[string][]map[string]any),
	}
}

func (s *MemoryStore) Insert(collection string, doc map[string]any) {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.data[collection] = append(s.data[collection], doc)
}

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

// backward-compatible alias
func (s *MemoryStore) GetByField(collection, field string, value any) (map[string]any, bool) {
	return s.FindByField(collection, field, value)
}

func (s *MemoryStore) DeleteByField(collection, field string, value any) {
	s.mu.Lock()
	defer s.mu.Unlock()
	rows := s.data[collection]
	filtered := []map[string]any{}
	for _, doc := range rows {
		if v, has := doc[field]; !has || v != value {
			filtered = append(filtered, doc)
		}
	}
	s.data[collection] = filtered
}

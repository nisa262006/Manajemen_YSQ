package com.sahabatquran.app.web.service.admin;

import com.sahabatquran.app.web.entity.Event;
import com.sahabatquran.app.web.repository.admin.EventRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class EventService {

    @Autowired
    private EventRepository eventRepository;

    public Event saveEvent(Event event) {
        return eventRepository.save(event);
    }

    public Event editEvent(String id, Event eventDetails) {
        Optional<Event> existingEventOpt = eventRepository.findById(id);
        if (existingEventOpt.isPresent()) {
            Event existingEvent = existingEventOpt.get();
            existingEvent.setNama(eventDetails.getNama());
            existingEvent.setWaktu_kegiatan_rencana(eventDetails.getWaktu_kegiatan_rencana());
            existingEvent.setWaktu_kegiatan_realisasi(eventDetails.getWaktu_kegiatan_realisasi());
            existingEvent.setCatatan_acara(eventDetails.getCatatan_acara());
            return eventRepository.save(existingEvent); // Save updated data
        } else {
            return null;
        }
    }

    public void deleteEvent(UUID id) {
        if (!eventRepository.existsById(String.valueOf(id))) {
            throw new IllegalArgumentException("Event tidak ditemukan: " + id);
        }
        eventRepository.deleteById(String.valueOf(id));
    }

    public List<Event> findAll() {
        return eventRepository.findAll();
    }
}
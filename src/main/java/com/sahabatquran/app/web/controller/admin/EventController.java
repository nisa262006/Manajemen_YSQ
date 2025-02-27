package com.sahabatquran.app.web.controller.admin;

import com.sahabatquran.app.web.entity.Event;
import com.sahabatquran.app.web.repository.admin.EventRepository;
import com.sahabatquran.app.web.service.admin.EventService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@Controller
@RequestMapping("/admin")
public class EventController {

    @Autowired
    private EventRepository eventRepository;

    @Autowired
    private EventService eventService;

    @GetMapping("/event")
    public String adminDataEvent(Model model) {
        List<Event> events = eventRepository.findAll();
        model.addAttribute("events", events);
        return "admin/event/event";
    }

    @GetMapping("/add-event")
    public String adminAddEvent(Model model) {
        model.addAttribute("event", new Event());
        return "admin/event/addEvent";
    }

    @PostMapping("/save-event")
    public String saveEvent(@Valid Event event, BindingResult result, Model model) {
        if (result.hasErrors()) {
            model.addAttribute("event", event);
            return "admin/event/addEvent";
        }

        eventService.saveEvent(event);
        return "redirect:/admin/event";
    }

    @GetMapping("/edit-event/{id}")
    public String adminEditEvent(@PathVariable("id") UUID id, Model model) {
        Event event = eventRepository.findById(String.valueOf(id))
                .orElseThrow(() -> new IllegalArgumentException("Invalid event Id: " + id));
        model.addAttribute("event", event);
        return "admin/event/editEvent";
    }

    @PostMapping("/save-edit-event")
    public String saveEditEvent(@Valid @ModelAttribute Event event, BindingResult result, Model model) {
        if (result.hasErrors()) {
            model.addAttribute("event", event);
            return "admin/event/editEvent";
        }

        Event updatedEvent = eventService.editEvent(event.getId(), event);
        if (updatedEvent == null) {
            model.addAttribute("error", "Event not found");
            return "admin/event/editEvent";
        }

        return "redirect:/admin/event";
    }

    @GetMapping("/delete-event/{id}")
    public String adminDeleteEvent(@PathVariable("id") UUID id) {
        eventService.deleteEvent(id);
        return "redirect:/admin/event";
    }
}
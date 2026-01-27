<?php
namespace App\Services;

class HikvisionService
{
    protected $storagePath;

    public function __construct()
    {
        $this->storagePath = storage_path('app/hikvision_events.json');
    }

    public function storeEvent(array $event)
    {
        $events = [];
        if (file_exists($this->storagePath)) {
            $content = file_get_contents($this->storagePath);
            $events = json_decode($content, true) ?: [];
        }

        $event['id'] = uniqid('ev_');
        $event['received_at'] = date('c');

        array_unshift($events, $event);

        // Keep file bounded to recent 500 events
        $events = array_slice($events, 0, 500);

        file_put_contents($this->storagePath, json_encode($events, JSON_PRETTY_PRINT));

        return $event;
    }

    public function getRecentEvents(int $limit = 50)
    {
        if (!file_exists($this->storagePath)) {
            return [];
        }

        $content = file_get_contents($this->storagePath);
        $events = json_decode($content, true) ?: [];

        return array_slice($events, 0, $limit);
    }
}

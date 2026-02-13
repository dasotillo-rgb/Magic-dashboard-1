'use client';
import React, { useState, useEffect } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from '@dnd-kit/sortable';

// Modular Widgets
import CarFinderWidget from '@/components/dashboard/CarFinderWidget';
import SentimentWidget from '@/components/dashboard/SentimentWidget';
import TasksWidget from '@/components/dashboard/TasksWidget';
import OpportunitiesWidget from '@/components/dashboard/OpportunitiesWidget';
import MarketPulseWidget from '@/components/dashboard/MarketPulseWidget';
import OrdersWidget from '@/components/dashboard/OrdersWidget';
import SortableWidget from '@/components/dashboard/SortableWidget';
import WeatherWidget from '@/components/dashboard/WeatherWidget';
import CollapsibleWidget from '@/components/dashboard/CollapsibleWidget';
import ApeChat from '@/components/dashboard/ApeChat';
import NotificationSystem from '@/components/dashboard/NotificationSystem';

const hardcodedData = {
  assets: { value: 128430.22, change: 12.5 },
  signal: { status: 'STRONG BUY', strategy: 'BTC/USDT Strategy' },
  marketPulse: [
    { name: 'Bitcoin', price: 69476 },
    { name: 'Ethereum', price: 2034.8 },
    { name: 'Solana', price: 84.72 },
  ]
};

const DEFAULT_ITEMS = [
  { id: 'cars', colSpan: 'lg:col-span-4' },
  { id: 'tasks', colSpan: 'lg:col-span-4' },
  { id: 'sentiment', colSpan: 'lg:col-span-4' },
  { id: 'orders', colSpan: 'lg:col-span-12' },
  { id: 'console', colSpan: 'lg:col-span-7' },
  { id: 'market', colSpan: 'lg:col-span-5' },
];

export default function Dashboard() {
  const [items, setItems] = useState<typeof DEFAULT_ITEMS>([]);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const saved = localStorage.getItem('dashboard_layout');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const migrated = parsed.map((item: any) => {
          if (item.id === 'location') return { ...item, id: 'tasks' };
          if (item.id === 'signal') return { ...item, id: 'sentiment' };
          if (item.id === 'assets') return { ...item, id: 'cars' };
          return item;
        });
        setItems(migrated);
      } catch (e) {
        setItems(DEFAULT_ITEMS);
      }
    } else {
      setItems(DEFAULT_ITEMS);
    }
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setItems((prevItems) => {
        const oldIndex = prevItems.findIndex((item) => item.id === active.id);
        const newIndex = prevItems.findIndex((item) => item.id === over.id);
        const newOrder = arrayMove(prevItems, oldIndex, newIndex);
        localStorage.setItem('dashboard_layout', JSON.stringify(newOrder));
        return newOrder;
      });
    }
  };

  const renderWidget = (id: string) => {
    switch (id) {
      case 'cars':
        return (
          <CollapsibleWidget id="cars" compactHeight={280}>
            <CarFinderWidget borderColor="border-blue-500/20" />
          </CollapsibleWidget>
        );
      case 'tasks':
        return (
          <CollapsibleWidget id="tasks" compactHeight={280}>
            <TasksWidget borderColor="border-orange-500/20" />
          </CollapsibleWidget>
        );
      case 'sentiment':
        return (
          <CollapsibleWidget id="sentiment" compactHeight={280}>
            <SentimentWidget />
          </CollapsibleWidget>
        );
      case 'console':
        return (
          <CollapsibleWidget id="console" compactHeight={280}>
            <OpportunitiesWidget borderColor="border-amber-500/20" />
          </CollapsibleWidget>
        );
      case 'market':
        return (
          <CollapsibleWidget id="market" compactHeight={280}>
            <MarketPulseWidget data={hardcodedData.marketPulse} borderColor="border-blue-500/20" />
          </CollapsibleWidget>
        );
      case 'orders':
        return (
          <CollapsibleWidget id="orders" compactHeight={200}>
            <OrdersWidget borderColor="border-[#00FF41]/20" />
          </CollapsibleWidget>
        );
      default:
        return null;
    }
  };

  if (!isClient) return null;

  return (
    <main className="p-6 lg:p-10 max-w-[1600px] mx-auto space-y-6 relative min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Overview</h1>
          <p className="text-sm text-gray-400 mt-1">System Operational <span className="inline-block w-2 h-2 rounded-full bg-[#00FF41] ml-1 align-middle" /></p>
        </div>
        <WeatherWidget />
      </div>

      {/* Draggable Grid */}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={items.map(i => i.id)} strategy={rectSortingStrategy}>
          <div className="grid grid-cols-12 gap-5">
            {items.map((item) => (
              <SortableWidget key={item.id} id={item.id} className={`col-span-12 ${item.colSpan}`}>
                {renderWidget(item.id)}
              </SortableWidget>
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {/* Watermark */}
      <div className="fixed bottom-20 right-8 pointer-events-none z-10">
        <span className="text-[10px] font-mono tracking-[0.3em] text-white/20 uppercase">Magic Dashboard</span>
      </div>

      {/* Floating AI Chat */}
      <ApeChat />

      {/* Push Notifications */}
      <NotificationSystem />
    </main>
  );
}


import React from 'react';
import OrderCard from './OrderCard';
import { useLanguage } from '@/contexts/LanguageContext';
import EmptyOrderState from './EmptyOrderState';
import { Skeleton } from "@/components/ui/skeleton";

interface OrderListProps {
  orders: any[];
  onViewOrder: (id: string) => void;
  loading?: boolean;
  activeTab?: string;
}

const OrderList: React.FC<OrderListProps> = ({ 
  orders, 
  onViewOrder, 
  loading = false,
  activeTab = 'all'
}) => {
  const { language } = useLanguage();

  if (loading) {
    return (
      <div className="space-y-4" data-language={language}>
        {Array(3).fill(null).map((_, index) => (
          <div key={index} className="border rounded-lg p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 space-y-2 sm:space-y-0">
              <Skeleton className="h-6 w-32 sm:w-48" />
              <Skeleton className="h-6 w-20 sm:w-24" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4 mb-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
            </div>
            <div className="flex justify-end">
              <Skeleton className="h-10 w-24 sm:w-32" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!orders || orders.length === 0) {
    return <EmptyOrderState activeTab={activeTab} />;
  }

  return (
    <div className="space-y-3 sm:space-y-4" data-language={language}>
      {orders.map((order) => (
        <OrderCard 
          key={order.id} 
          order={order} 
          onViewOrder={onViewOrder} 
        />
      ))}
    </div>
  );
};

export default OrderList;

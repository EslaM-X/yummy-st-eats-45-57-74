
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import OrderStatusBadge from './OrderStatusBadge';
import { formatDate } from '@/utils/formatUtils';
import { useLanguage } from '@/contexts/LanguageContext';
import { OrderItem } from '@/types';

interface OrderCardProps {
  order: any;
  onViewOrder: (id: string) => void;
}

const OrderCard: React.FC<OrderCardProps> = ({ order, onViewOrder }) => {
  const { language } = useLanguage();
  
  const labels = {
    orderNumber: language === 'en' ? 'Order Number:' : 'رقم الطلب:',
    totalAmount: language === 'en' ? 'Total Amount:' : 'المبلغ الإجمالي:',
    numProducts: language === 'en' ? 'Number of Products:' : 'عدد المنتجات:',
    paymentMethod: language === 'en' ? 'Payment Method:' : 'طريقة الدفع:',
    viewDetails: language === 'en' ? 'Order Details' : 'تفاصيل الطلب',
    card: language === 'en' ? 'Card' : 'بطاقة',
    cash: language === 'en' ? 'Cash' : 'نقدي'
  };
  
  const paymentMethodText = order.payment_method === 'card' ? labels.card : labels.cash;
  
  // Calculate number of items, checking both items JSON field and order_items relationship
  const itemsLength = Array.isArray(order.items) ? order.items.length : 0;
  const orderItems = Array.isArray(order.order_items) ? order.order_items : [];
  const itemCount = itemsLength || orderItems.length || 0;
  
  // Format order ID for display
  const shortOrderId = order.id && order.id.length > 8 
    ? `${order.id.substring(0, 8)}...`
    : order.id;
  
  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow">
      <CardContent className="p-0">
        <div className="p-4 sm:p-6">
          {/* Header section - responsive layout */}
          <div className="flex flex-col space-y-3 sm:space-y-0 sm:flex-row sm:items-center sm:justify-between mb-4">
            <div className="min-w-0 flex-1">
              <h3 className="text-base sm:text-lg font-semibold text-gray-800 dark:text-white truncate">
                {order.restaurants?.name || (language === 'en' ? 'Restaurant' : 'مطعم')}
              </h3>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
                {formatDate(order.created_at, language)}
              </p>
            </div>
            <div className="flex-shrink-0">
              <OrderStatusBadge status={order.status} className="text-xs sm:text-sm" />
            </div>
          </div>

          {/* Details grid - responsive */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 mb-4 sm:mb-6">
            <div className="text-xs sm:text-sm bg-gray-50 dark:bg-gray-800 rounded-lg p-2 sm:p-3">
              <span className="font-medium text-gray-600 dark:text-gray-300 block sm:inline">
                {labels.orderNumber}
              </span>
              <span className="text-gray-800 dark:text-white block sm:inline sm:ml-1">
                {shortOrderId}
              </span>
            </div>
            
            <div className="text-xs sm:text-sm bg-gray-50 dark:bg-gray-800 rounded-lg p-2 sm:p-3">
              <span className="font-medium text-gray-600 dark:text-gray-300 block sm:inline">
                {labels.totalAmount}
              </span>
              <span className="text-gray-800 dark:text-white font-semibold block sm:inline sm:ml-1">
                {order.total_amount} ST
              </span>
            </div>
            
            <div className="text-xs sm:text-sm bg-gray-50 dark:bg-gray-800 rounded-lg p-2 sm:p-3">
              <span className="font-medium text-gray-600 dark:text-gray-300 block sm:inline">
                {labels.numProducts}
              </span>
              <span className="text-gray-800 dark:text-white block sm:inline sm:ml-1">
                {itemCount}
              </span>
            </div>
            
            <div className="text-xs sm:text-sm bg-gray-50 dark:bg-gray-800 rounded-lg p-2 sm:p-3">
              <span className="font-medium text-gray-600 dark:text-gray-300 block sm:inline">
                {labels.paymentMethod}
              </span>
              <span className="text-gray-800 dark:text-white block sm:inline sm:ml-1">
                {paymentMethodText}
              </span>
            </div>
          </div>

          {/* Action button */}
          <div className="flex justify-end">
            <Button 
              variant="outline" 
              onClick={() => onViewOrder(order.id)}
              className="w-full sm:w-auto text-yellow-700 border-yellow-700 hover:bg-yellow-50 hover:text-yellow-800 dark:text-yellow-500 dark:border-yellow-500 dark:hover:bg-yellow-950 text-sm"
              size="sm"
            >
              {labels.viewDetails}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default OrderCard;

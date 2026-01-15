/**
 * CardCatalog - Browse and order ID cards
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { CreditCard, Search, ShoppingCart, Clock, Package } from 'lucide-react';
import { userCardApi, Card as CardType, CardType as CardTypeEnum, PaginatedCardsResponse } from '@/api/userCard.api';
import { formatPrice } from '@/utils/cardHelpers';
import { toast } from '@/hooks/use-toast';
import OrderCardDialog from './OrderCardDialog';

const CardCatalog: React.FC = () => {
  const [cards, setCards] = useState<CardType[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [cardTypeFilter, setCardTypeFilter] = useState<string>('all');
  const [selectedCard, setSelectedCard] = useState<CardType | null>(null);
  const [orderDialogOpen, setOrderDialogOpen] = useState(false);

  const fetchCards = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (search) params.search = search;
      if (cardTypeFilter !== 'all') params.cardType = cardTypeFilter;
      
      const response = await userCardApi.getCards(params);
      setCards(response.data || []);
    } catch (error: any) {
      console.error('Error fetching cards:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to load cards',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCards();
  }, [cardTypeFilter]);

  useEffect(() => {
    const debounce = setTimeout(() => {
      fetchCards();
    }, 300);
    return () => clearTimeout(debounce);
  }, [search]);

  const handleOrderClick = (card: CardType) => {
    setSelectedCard(card);
    setOrderDialogOpen(true);
  };

  const getCardTypeColor = (type: CardTypeEnum) => {
    switch (type) {
      case CardTypeEnum.NFC:
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case CardTypeEnum.PVC:
        return 'bg-green-100 text-green-800 border-green-200';
      case CardTypeEnum.TEMPORARY:
        return 'bg-orange-100 text-orange-800 border-orange-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">ID Cards</h2>
          <p className="text-muted-foreground">Browse and order your ID cards</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search cards..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={cardTypeFilter} onValueChange={setCardTypeFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Card Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value={CardTypeEnum.NFC}>NFC Cards</SelectItem>
            <SelectItem value={CardTypeEnum.PVC}>PVC Cards</SelectItem>
            <SelectItem value={CardTypeEnum.TEMPORARY}>Temporary Cards</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Cards Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="overflow-hidden">
              <Skeleton className="h-48 w-full" />
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardFooter>
                <Skeleton className="h-10 w-full" />
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : cards.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="flex flex-col items-center gap-4">
            <CreditCard className="h-16 w-16 text-muted-foreground" />
            <div>
              <h3 className="text-lg font-semibold">No Cards Available</h3>
              <p className="text-muted-foreground">There are no cards available at the moment.</p>
            </div>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cards.map((card) => (
            <Card key={card.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              {/* Card Image */}
              <div className="relative h-48 bg-gradient-to-br from-primary/10 to-primary/5">
                {card.cardImageUrl ? (
                  <img
                    src={card.cardImageUrl}
                    alt={card.cardName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <CreditCard className="h-20 w-20 text-primary/30" />
                  </div>
                )}
                <Badge className={`absolute top-3 right-3 ${getCardTypeColor(card.cardType)}`}>
                  {card.cardType}
                </Badge>
              </div>

              <CardHeader>
                <CardTitle className="text-lg">{card.cardName}</CardTitle>
                <CardDescription className="line-clamp-2">
                  {card.description || 'No description available'}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    Validity
                  </span>
                  <span className="font-medium">
                    {Math.floor(card.validityDays / 365)} year{card.validityDays >= 730 ? 's' : ''}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <Package className="h-4 w-4" />
                    Available
                  </span>
                  <span className="font-medium">{card.quantityAvailable} cards</span>
                </div>
                <div className="pt-2 border-t">
                  <span className="text-2xl font-bold text-primary">{formatPrice(card.price)}</span>
                </div>
              </CardContent>

              <CardFooter>
                <Button 
                  className="w-full" 
                  onClick={() => handleOrderClick(card)}
                  disabled={card.quantityAvailable <= 0}
                >
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  {card.quantityAvailable > 0 ? 'Order Now' : 'Out of Stock'}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* Order Dialog */}
      <OrderCardDialog
        card={selectedCard}
        open={orderDialogOpen}
        onOpenChange={setOrderDialogOpen}
        onSuccess={() => {
          setOrderDialogOpen(false);
          fetchCards();
        }}
      />
    </div>
  );
};

export default CardCatalog;

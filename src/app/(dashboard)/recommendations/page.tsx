'use client';

import * as React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Sparkles, AlertTriangle, Lightbulb } from 'lucide-react';
import { getDiscountRecommendations } from '@/app/actions';
import type { GenerateProductDiscountRecommendationsOutput } from '@/ai/flows/generate-product-discount-recommendations';
import { useToast } from '@/hooks/use-toast';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import type { PharmacyItem } from '@/lib/types';
import { collection } from 'firebase/firestore';


export default function RecommendationsPage() {
  const [loading, setLoading] = React.useState(false);
  const [recommendations, setRecommendations] =
    React.useState<GenerateProductDiscountRecommendationsOutput | null>(null);
  const { toast } = useToast();

  const firestore = useFirestore();
  const pharmacyQuery = useMemoFirebase(() => firestore ? collection(firestore, 'pharmacyItems') : null, [firestore]);
  const { data: pharmacyItems, isLoading: pharmacyLoading } = useCollection<PharmacyItem>(pharmacyQuery);

  const handleGenerate = async () => {
    if (!pharmacyItems || pharmacyItems.length === 0) {
        toast({
            variant: 'destructive',
            title: 'No pharmacy data',
            description: 'Cannot generate recommendations without pharmacy items.',
        });
        return;
    }
    setLoading(true);
    setRecommendations(null);

    const productsForAI = pharmacyItems.map(item => ({
        productName: item.productName,
        category: item.category,
        supplier: item.supplier,
        purchasePrice: item.purchasePrice,
        sellingPrice: item.sellingPrice,
        quantity: item.quantity,
        expiryDate: item.expiryDate,
    }))

    const result = await getDiscountRecommendations({ products: productsForAI });

    if (result.success && result.data) {
      setRecommendations(result.data);
    } else {
      toast({
        variant: 'destructive',
        title: 'An error occurred',
        description: result.error || 'Unable to fetch AI recommendations.',
      });
    }
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-6 w-6 text-primary" />
                Intelligent Recommendations
              </CardTitle>
              <CardDescription className="mt-2">
                Use AI to identify products that should be considered for discounts based on stock levels and expiry dates.
              </CardDescription>
            </div>
            <Button onClick={handleGenerate} disabled={loading || pharmacyLoading} size="lg">
              {loading || pharmacyLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="mr-2 h-4 w-4" />
              )}
              {loading ? 'Analyzing...' : pharmacyLoading ? 'Loading Pharmacy...' : 'Generate Recommendations'}
            </Button>
          </div>
        </CardHeader>
      </Card>
      
      <div>
        {loading && (
            <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed bg-muted/50 p-12 text-center">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <p className="mt-4 text-lg font-medium">AI is analyzing your pharmacy...</p>
                <p className="mt-1 text-sm text-muted-foreground">This may take a moment.</p>
            </div>
        )}

        {recommendations && (
            <div>
                <h2 className="text-2xl font-bold mb-4">Recommended for Discount</h2>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {recommendations.recommendedProducts.length > 0 ? (
                        recommendations.recommendedProducts.map((rec, index) => (
                            <Card key={index} className="flex flex-col">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <AlertTriangle className="h-5 w-5 text-yellow-500" />
                                        {rec.productName}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="flex-grow">
                                    <div className="flex items-start gap-3 rounded-md bg-muted/50 p-4">
                                        <Lightbulb className="h-5 w-5 mt-1 text-primary flex-shrink-0" />
                                        <p className="text-sm text-foreground">
                                            <span className="font-semibold">Reason:</span> {rec.reason}
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    ) : (
                        <Card className="md:col-span-2 lg:col-span-3">
                            <CardContent className="p-6 text-center">
                                <p>No specific discount recommendations at this time. All stock looks healthy!</p>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        )}
      </div>
    </div>
  );
}

import { 
  Globe, 
  Shield, 
  Lock, 
  Star, 
  TrendingUp, 
  DollarSign, 
  Calendar, 
  Settings,
  CheckCircle,
  XCircle,
  AlertCircle,
  Info
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useIsMobile } from "@/hooks/use-mobile";

import type { DomainTableRow } from "@/types/domain";

export function DomainCellViewer({ domain }: { domain: DomainTableRow }) {
  const isMobile = useIsMobile();

  // Helper function to format prices
  const formatPrice = (price: number, currency: string) => {
    return `${currency} ${price.toFixed(2)}`;
  };

  return (
    <Drawer direction={isMobile ? "bottom" : "right"}>
      <DrawerTrigger asChild>
        <Button variant="link" className="text-foreground w-fit px-0 text-left">
          {domain.displayName}
        </Button>
      </DrawerTrigger>
      <DrawerContent 
        className="!w-[60vw] !max-w-[900px] !mx-auto"
        style={{ width: '60vw', maxWidth: '900px' }}
      >
        <DrawerHeader className="text-left pb-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-primary/10 rounded-full">
              <Globe className="h-6 w-6 text-primary" />
            </div>
            <div>
              <DrawerTitle className="text-2xl font-bold">{domain.displayName}</DrawerTitle>
              <DrawerDescription className="text-base">
                {domain.description}
              </DrawerDescription>
            </div>
          </div>
        </DrawerHeader>
        
        <div className="px-8 pb-8">
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="pricing">Pricing</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview" className="space-y-8 mt-8 max-h-[60vh] overflow-y-auto pr-2">
              {/* Status Cards */}
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <div className={`p-1 rounded-full ${domain.status === 'active' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'}`}>
                        {domain.status === 'active' ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                      </div>
                      Status
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Badge 
                      variant={domain.status === 'active' ? 'default' : 'secondary'}
                      className="capitalize"
                    >
                      {domain.status}
                    </Badge>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-blue-600" />
                      Popularity
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Badge 
                      variant={domain.popularity === 'high' ? 'default' : 'outline'}
                      className="capitalize"
                    >
                      {domain.popularity}
                    </Badge>
                  </CardContent>
                </Card>
              </div>

              {/* Features Grid */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Features & Capabilities
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <div className={`p-1 rounded ${domain.supportsIdn ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                          <Globe className="h-4 w-4" />
                        </div>
                        <span className="text-sm">IDN Support</span>
                        {domain.supportsIdn ? <CheckCircle className="h-4 w-4 text-green-600" /> : <XCircle className="h-4 w-4 text-gray-400" />}
                      </div>
                      <div className="flex items-center gap-2">
                        <div className={`p-1 rounded ${domain.supportsDnssec ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                          <Shield className="h-4 w-4" />
                        </div>
                        <span className="text-sm">DNSSEC</span>
                        {domain.supportsDnssec ? <CheckCircle className="h-4 w-4 text-green-600" /> : <XCircle className="h-4 w-4 text-gray-400" />}
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <div className={`p-1 rounded ${domain.requiresAuthCode ? 'bg-orange-100 text-orange-600' : 'bg-gray-100 text-gray-400'}`}>
                          <Lock className="h-4 w-4" />
                        </div>
                        <span className="text-sm">Auth Code Required</span>
                        {domain.requiresAuthCode ? <CheckCircle className="h-4 w-4 text-orange-600" /> : <XCircle className="h-4 w-4 text-gray-400" />}
                      </div>
                      <div className="flex items-center gap-2">
                        <div className={`p-1 rounded ${domain.isPremium ? 'bg-yellow-100 text-yellow-600' : 'bg-gray-100 text-gray-400'}`}>
                          <Star className="h-4 w-4" />
                        </div>
                        <span className="text-sm">Premium Domain</span>
                        {domain.isPremium ? <CheckCircle className="h-4 w-4 text-yellow-600" /> : <XCircle className="h-4 w-4 text-gray-400" />}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Registration Periods */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Registration Periods
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">{domain.minPeriod}</div>
                      <div className="text-sm text-muted-foreground">Min Years</div>
                    </div>
                    <div className="text-muted-foreground">to</div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">{domain.maxPeriod}</div>
                      <div className="text-sm text-muted-foreground">Max Years</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="pricing" className="space-y-8 mt-8">
              {domain.fullDomainData?.prices ? (
                <div className="space-y-8 max-h-[60vh] overflow-y-auto pr-2">
                  {/* Reseller Price */}
                  <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950/20">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2 text-blue-700 dark:text-blue-400">
                        <DollarSign className="h-5 w-5" />
                        Reseller Price
                      </CardTitle>
                      <CardDescription>
                        Current reseller pricing with promotional details
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-6">
                        <div className="grid grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <Label className="text-sm font-medium text-muted-foreground">Product Price</Label>
                            <div className="p-4 border rounded-lg bg-muted/30">
                              <div className="text-2xl font-bold">{formatPrice(domain.fullDomainData.prices.reseller_price.product.price, domain.fullDomainData.prices.reseller_price.product.currency)}</div>
                              <div className="text-sm text-muted-foreground">Retail Price</div>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label className="text-sm font-medium text-muted-foreground">Reseller Price</Label>
                            <div className="p-4 border rounded-lg bg-green-50 dark:bg-green-950/20">
                              <div className="text-2xl font-bold text-green-600">{formatPrice(domain.fullDomainData.prices.reseller_price.reseller.price, domain.fullDomainData.prices.reseller_price.reseller.currency)}</div>
                              <div className="text-sm text-muted-foreground">Wholesale Price</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* All Pricing Types */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Renewal Price */}
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          Renewal Price
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">Product:</span>
                            <span className="font-medium">{formatPrice(domain.fullDomainData.prices.renew_price.product.price, domain.fullDomainData.prices.renew_price.product.currency)}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">Reseller:</span>
                            <span className="font-medium text-green-600">{formatPrice(domain.fullDomainData.prices.renew_price.reseller.price, domain.fullDomainData.prices.renew_price.reseller.currency)}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Transfer Price */}
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2">
                          <Settings className="h-4 w-4" />
                          Transfer Price
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">Product:</span>
                            <span className="font-medium">{formatPrice(domain.fullDomainData.prices.transfer_price.product.price, domain.fullDomainData.prices.transfer_price.product.currency)}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">Reseller:</span>
                            <span className="font-medium text-green-600">{formatPrice(domain.fullDomainData.prices.transfer_price.reseller.price, domain.fullDomainData.prices.transfer_price.reseller.currency)}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Restore Price */}
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2">
                          <Shield className="h-4 w-4" />
                          Restore Price
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">Product:</span>
                            <span className="font-medium">{formatPrice(domain.fullDomainData.prices.restore_price.product.price, domain.fullDomainData.prices.restore_price.product.currency)}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">Reseller:</span>
                            <span className="font-medium text-green-600">{formatPrice(domain.fullDomainData.prices.restore_price.reseller.price, domain.fullDomainData.prices.restore_price.reseller.currency)}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Soft Restore Price */}
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2">
                          <Lock className="h-4 w-4" />
                          Soft Restore Price
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">Product:</span>
                            <span className="font-medium">{formatPrice(domain.fullDomainData.prices.soft_restore_price.product.price, domain.fullDomainData.prices.soft_restore_price.product.currency)}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">Reseller:</span>
                            <span className="font-medium text-green-600">{formatPrice(domain.fullDomainData.prices.soft_restore_price.reseller.price, domain.fullDomainData.prices.soft_restore_price.reseller.currency)}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Additional Pricing */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Setup Price */}
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base">Setup Price</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">Product:</span>
                            <span className="font-medium">{formatPrice(domain.fullDomainData.prices.setup_price.product.price, domain.fullDomainData.prices.setup_price.product.currency)}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">Reseller:</span>
                            <span className="font-medium text-green-600">{formatPrice(domain.fullDomainData.prices.setup_price.reseller.price, domain.fullDomainData.prices.setup_price.reseller.currency)}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Domicile Price */}
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base">Domicile Price</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">Product:</span>
                            <span className="font-medium">{formatPrice(domain.fullDomainData.prices.domicile_price.product.price, domain.fullDomainData.prices.domicile_price.product.currency)}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">Reseller:</span>
                            <span className="font-medium text-green-600">{formatPrice(domain.fullDomainData.prices.domicile_price.reseller.price, domain.fullDomainData.prices.domicile_price.reseller.currency)}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Update Price */}
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base">Update Price</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">Product:</span>
                            <span className="font-medium">{formatPrice(domain.fullDomainData.prices.update_price.product.price, domain.fullDomainData.prices.update_price.product.currency)}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">Reseller:</span>
                            <span className="font-medium text-green-600">{formatPrice(domain.fullDomainData.prices.update_price.reseller.price, domain.fullDomainData.prices.update_price.reseller.currency)}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Promotion Details */}
                  {domain.fullDomainData.prices.reseller_price.promotion_details && (
                    <Card className="border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20">
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2 text-yellow-700 dark:text-yellow-400">
                          <Star className="h-5 w-5" />
                          Promotion Details
                        </CardTitle>
                        <CardDescription>
                          Special pricing available for a limited time
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-6">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label className="text-sm font-medium text-muted-foreground">Start Date</Label>
                              <div className="text-sm font-medium">
                                {new Date(domain.fullDomainData.prices.reseller_price.promotion_details.start_date).toLocaleDateString()}
                              </div>
                            </div>
                            <div>
                              <Label className="text-sm font-medium text-muted-foreground">End Date</Label>
                              <div className="text-sm font-medium">
                                {new Date(domain.fullDomainData.prices.reseller_price.promotion_details.end_date).toLocaleDateString()}
                              </div>
                            </div>
                          </div>
                          <Separator />
                          <div className="space-y-2">
                            <Label className="text-sm font-medium text-muted-foreground">Non-Promotional Price</Label>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="p-3 border rounded-lg bg-white dark:bg-gray-900">
                                <div className="text-lg font-bold">{formatPrice(domain.fullDomainData.prices.reseller_price.promotion_details.non_promo_price.product.price, domain.fullDomainData.prices.reseller_price.promotion_details.non_promo_price.product.currency)}</div>
                                <div className="text-sm text-muted-foreground">Product Price</div>
                              </div>
                              <div className="p-3 border rounded-lg bg-white dark:bg-gray-900">
                                <div className="text-lg font-bold text-green-600">{formatPrice(domain.fullDomainData.prices.reseller_price.promotion_details.non_promo_price.reseller.price, domain.fullDomainData.prices.reseller_price.promotion_details.non_promo_price.reseller.currency)}</div>
                                <div className="text-sm text-muted-foreground">Reseller Price</div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              ) : (
                <Card>
                  <CardContent className="text-center py-8">
                    <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No pricing information available</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
            
            <TabsContent value="settings" className="space-y-8 mt-8 max-h-[60vh] overflow-y-auto pr-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Domain Settings</CardTitle>
                  <CardDescription>Configure domain preferences and restrictions</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="status">Status</Label>
                      <Select defaultValue={domain.status}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="inactive">Inactive</SelectItem>
                          <SelectItem value="premium">Premium</SelectItem>
                          <SelectItem value="restricted">Restricted</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="popularity">Popularity</Label>
                      <Select defaultValue={domain.popularity}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="low">Low</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="minPeriod">Min Period (years)</Label>
                      <Input id="minPeriod" defaultValue={domain.minPeriod.toString()} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="maxPeriod">Max Period (years)</Label>
                      <Input id="maxPeriod" defaultValue={domain.maxPeriod.toString()} />
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {domain.restrictions.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Restrictions</CardTitle>
                    <CardDescription>Domain-specific limitations and requirements</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-3">
                      {domain.restrictions.map((restriction, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          <Info className="h-3 w-3 mr-1" />
                          {restriction}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>
        
        <DrawerFooter className="px-8">
          <div className="flex gap-4">
            <Button className="flex-1">
              <Settings className="h-4 w-4 mr-2" />
              Save Changes
            </Button>
            <DrawerClose asChild>
              <Button variant="outline">Close</Button>
            </DrawerClose>
          </div>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}

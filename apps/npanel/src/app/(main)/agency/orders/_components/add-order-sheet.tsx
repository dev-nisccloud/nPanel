"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { ShoppingCart, XIcon, Plus, Check, ChevronsUpDown, Loader2, Server } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/npanel-ui/sheet";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import { DatePicker } from "@/components/npanel-ui/date-picker";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { trpc } from "@/utils/trpc";

import { orderSchema } from "./schema";

const FormSchema = z.object({
  orderNumber: z.string().min(1, { message: "Order number is required." }),
  companyName: z.string().min(1, { message: "Company name is required." }),
  date: z.string().min(1, { message: "Date is required." }),
  paymentStatus: z.enum(["pending", "paid", "failed", "refunded"]),
  totalAmount: z.number().min(0, { message: "Total amount must be positive." }),
  status: z.enum(["pending", "processing", "active", "suspended", "cancelled"]),
  // Service Plan fields
  servicePlanId: z.string().min(1, { message: "Service plan is required." }),
  servicePlanName: z.string().optional(),
  // Customer fields
  customerType: z.enum(["existing", "new"]),
  existingCustomerId: z.string().optional(),
  existingCustomerName: z.string().optional(),
  // New customer fields
  newCustomerName: z.string().optional(),
  newCustomerEmail: z.string().email("Invalid email address").optional().or(z.literal("")),
  newCustomerPhone: z.string().optional(),
  newCustomerCompany: z.string().optional(),
  newCustomerAddress: z.string().optional(),
  newCustomerCity: z.string().optional(),
  newCustomerState: z.string().optional(),
  newCustomerPostCode: z.string().optional(),
  newCustomerCountry: z.string().optional(),
  // Subscription fields
  subscriptionName: z.string().min(1, "Domain name is required"),
  hostingType: z.enum(["vrt_hst", "standard", "none"]).default("vrt_hst"),
  ipAddress: z.string().optional(),
  // FTP login and password are auto-generated
  description: z.string().optional(),
  adminDescription: z.string().optional(),
}).refine((data) => {
  if (data.customerType === "existing") {
    return data.existingCustomerId && data.existingCustomerName;
  }
  if (data.customerType === "new") {
    return data.newCustomerName && data.newCustomerEmail;
  }
  return true;
}, {
  message: "Please complete all required customer fields",
  path: ["customerType"],
});

interface AddOrderSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddOrder: (order: Omit<z.infer<typeof orderSchema>, "id">) => void;
}

export function AddOrderSheet({ open, onOpenChange, onAddOrder }: AddOrderSheetProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isLoadingData, setIsLoadingData] = React.useState(false);
  const [servicePlanOpen, setServicePlanOpen] = React.useState(false);
  const [customerOpen, setCustomerOpen] = React.useState(false);

  // tRPC queries
  const { data: servicePlansData, isLoading: isLoadingServicePlans, error: servicePlansError } = trpc.plesk.servicePlans.getAll.useQuery(
    {},
    {
      enabled: open, // Only fetch when sheet is open
      staleTime: 5 * 60 * 1000, // 5 minutes
    }
  );

  const { data: customersData, isLoading: isLoadingCustomers, error: customersError, refetch: refetchCustomers } = trpc.plesk.customers.getAll.useQuery(
    {},
    {
      enabled: open, // Only fetch when sheet is open
      staleTime: 5 * 60 * 1000, // 5 minutes
    }
  );


  // Customer creation mutation
  const createCustomerMutation = trpc.plesk.customersCreate.create.useMutation({
    onSuccess: (data) => {
      // console.log("=== CUSTOMER MUTATION SUCCESS ===");
      // console.log("Success data:", data);
    },
    onError: (error) => {
      // console.log("=== CUSTOMER MUTATION ERROR ===");
      // console.log("Mutation error:", error);
      // console.log("Error message:", error.message);
      // console.log("Error data:", error.data);
      // console.log("Error code:", error.code);
    },
  });

  // Subscription creation mutation
  const createSubscriptionMutation = trpc.plesk.subscriptionsCreate.create.useMutation({
    onSuccess: (data) => {
      // console.log("=== SUBSCRIPTION MUTATION SUCCESS ===");
      // console.log("Success data:", data);
    },
    onError: (error) => {
      // console.log("=== SUBSCRIPTION MUTATION ERROR ===");
      // console.log("Mutation error:", error);
      // console.log("Error message:", error.message);
      // console.log("Error data:", error.data);
      // console.log("Error code:", error.code);
    },
  });

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    mode: "onChange", // Validate on change to catch errors early
    defaultValues: {
      orderNumber: `ORD-${new Date().getFullYear()}-${String(Date.now()).slice(-3)}`,
      companyName: "",
      date: new Date().toISOString().split('T')[0],
      paymentStatus: "pending",
      totalAmount: 0,
      status: "pending",
      servicePlanId: "",
      servicePlanName: "",
      customerType: "existing",
      existingCustomerId: "",
      existingCustomerName: "",
      newCustomerName: "",
      newCustomerEmail: "",
      newCustomerPhone: "",
      newCustomerCompany: "",
      newCustomerAddress: "",
      newCustomerCity: "",
      newCustomerState: "",
      newCustomerPostCode: "",
      newCustomerCountry: "",
      // Subscription defaults
      subscriptionName: "",
      hostingType: "vrt_hst",
      ipAddress: "",
      // FTP login and password are auto-generated
      description: "",
      adminDescription: "",
    },
  });

  // Watch customer type to show/hide relevant fields
  const customerType = form.watch("customerType");

  // Parse service plans from XML response
  const servicePlans = React.useMemo(() => {
    if (!servicePlansData?.parsed) return [];
    
    try {
      const plans = (servicePlansData.parsed as any)?.packet?.["service-plan"]?.get?.result;
      if (!plans) return [];
      
      // Handle both single and multiple results
      const planArray = Array.isArray(plans) ? plans : [plans];
      
      return planArray.map((plan: any) => ({
        id: (plan.id?.["#text"] || plan.id)?.toString() || "",
        name: plan.name?.["#text"] || plan.name,
        description: plan.description?.["#text"] || plan.description || "",
      })).filter((plan: any) => plan.id && plan.name);
    } catch (error) {
      // console.error("Error parsing service plans:", error);
      return [];
    }
  }, [servicePlansData]);

  // Parse customers from XML response
  const customers = React.useMemo(() => {
    if (!customersData?.parsed) return [];
    
    try {
      const customerList = (customersData.parsed as any)?.packet?.customer?.get?.result;
      if (!customerList) return [];
      
      // Handle both single and multiple results
      const customerArray = Array.isArray(customerList) ? customerList : [customerList];
      
      const parsedCustomers = customerArray.map((customer: any) => {
        // Extract customer info from the correct structure
        const genInfo = customer.data?.gen_info;
        if (!genInfo) return null;
        
        // Use company name if available, otherwise use personal name
        const displayName = genInfo.cname || genInfo.pname || "";
        
        return {
          id: customer.id?.toString() || "",
          name: displayName,
          email: genInfo.email || "",
          company: genInfo.cname || "",
          phone: genInfo.phone || "",
        };
      }).filter((customer: any) => customer && customer.id && customer.name);
      
      // console.log("=== CUSTOMER PARSING DEBUG ===");
      // console.log("Raw customer data:", customerArray);
      // console.log("Parsed customers:", parsedCustomers);
      // console.log("Available customer IDs:", parsedCustomers.map(c => c.id));
      
      return parsedCustomers;
    } catch (error) {
      // console.error("Error parsing customers:", error);
      return [];
    }
  }, [customersData]);

  // Check if data is still loading
  React.useEffect(() => {
    const isLoading = isLoadingServicePlans || isLoadingCustomers;
    setIsLoadingData(isLoading);
  }, [isLoadingServicePlans, isLoadingCustomers]);

  const onSubmit = async (data: z.infer<typeof FormSchema>) => {
    // console.log("=== FORM SUBMISSION DEBUG ===");
    // console.log("Form data being submitted:", data);
    // console.log("Form validation state:", form.formState);
    // console.log("Form errors:", form.formState.errors);
    
    // Check if there are validation errors
    if (Object.keys(form.formState.errors).length > 0) {
      // console.error("Form has validation errors, preventing submission:", form.formState.errors);
      toast.error("Please fix the form errors before submitting");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // If creating a new customer, do that first
      let customerId = data.existingCustomerId;
      let customerName = data.existingCustomerName;
      let customerCreated = false;
      let subscriptionCreated = false;
      
      if (data.customerType === "new") {
        try {
          // console.log("=== CUSTOMER CREATION DEBUG ===");
          // console.log("Creating customer with data:", {
          //   personName: data.newCustomerName!,
          //   email: data.newCustomerEmail!,
          //   phone: data.newCustomerPhone || undefined,
          //   company: data.newCustomerCompany || undefined,
          //   address: data.newCustomerAddress || undefined,
          //   city: data.newCustomerCity || undefined,
          //   state: data.newCustomerState || undefined,
          //   postCode: data.newCustomerPostCode || undefined,
          //   country: data.newCustomerCountry || undefined,
          // });
          
          const customerResult = await createCustomerMutation.mutateAsync({
            personName: data.newCustomerName!,
            email: data.newCustomerEmail!,
            phone: data.newCustomerPhone || undefined,
            company: data.newCustomerCompany || undefined,
            address: data.newCustomerAddress || undefined,
            city: data.newCustomerCity || undefined,
            state: data.newCustomerState || undefined,
            postCode: data.newCustomerPostCode || undefined,
            country: data.newCustomerCountry || undefined,
          });
          
          // console.log("Raw customer creation response:", customerResult);
          // console.log("Parsed customer creation response:", customerResult.parsed);
          
          // Extract customer ID from response
          const parsedResult = customerResult.parsed as any;
          // console.log("Looking for customer ID in:", parsedResult?.packet?.customer?.add?.result);
          
          customerId = parsedResult?.packet?.customer?.add?.result?.id?.["#text"] || 
                      parsedResult?.packet?.customer?.add?.result?.id;
          customerName = data.newCustomerName!;
          
          // console.log("Extracted customer ID:", customerId);
          
          if (customerId) {
            customerCreated = true;
            // console.log("Customer created successfully:", customerId);
            toast.success("Customer created successfully!");
            
            // Refresh customer data to include the newly created customer
            // console.log("Refreshing customer data...");
            await refetchCustomers();
          } else {
            // console.error("Customer ID not found in response structure:", parsedResult);
            throw new Error("Customer ID not found in response");
          }
        } catch (error) {
          // console.error("=== CUSTOMER CREATION ERROR DEBUG ===");
          // console.error("Error object:", error);
          // console.error("Error message:", error.message);
          // console.error("Error stack:", error.stack);
          
          // Check if it's a tRPC error with more details
          if (error && typeof error === 'object') {
            // console.error("Error details:", JSON.stringify(error, null, 2));
            
            // Check for tRPC error structure
            if ('data' in error) {
              // console.error("tRPC error data:", error.data);
            }
            if ('message' in error) {
              // console.error("tRPC error message:", error.message);
            }
            if ('code' in error) {
              //  console.error("tRPC error code:", error.code);
            }
          }
          
          toast.error("Failed to create customer", {
            description: "Please check the customer details and try again.",
          });
          setIsSubmitting(false);
          return;
        }
      } else {
        // For existing customers, validate they exist
        if (customerId && customerName) {
          // Double-check that the customer actually exists in our parsed list
          const customerExists = customers.find(c => c && c.id === customerId);
          if (customerExists) {
            customerCreated = true;
            // console.log("Using existing customer:", { customerId, customerName, customerExists });
          } else {
            // console.error("Selected customer not found in available customers list");
            // console.error("Selected customer ID:", customerId);
            // console.error("Available customer IDs:", customers.map(c => c.id));
            toast.error("Selected customer not found", {
              description: "The selected customer is no longer available. Please refresh and try again.",
            });
            setIsSubmitting(false);
            return;
          }
        } else {
          // console.error("Existing customer ID or name not provided");
          toast.error("Please select an existing customer", {
            description: "Customer ID or name is missing.",
          });
          setIsSubmitting(false);
          return;
        }
      }
      
      // Create subscription if customer ID is available
      if (customerId && customerCreated) {
        try {
          // console.log("=== SUBSCRIPTION CREATION DEBUG ===");
          // console.log("Customer ID being used:", customerId);
          // console.log("Customer ID type:", typeof customerId);
          // console.log("Parsed customer ID:", parseInt(customerId));
          // console.log("Creating subscription with data:", {
          //   name: data.subscriptionName,
          //   ownerId: parseInt(customerId),
          //   hostingType: data.hostingType,
          //   ipAddress: data.ipAddress || undefined,
          //   // FTP login and password are auto-generated
          //   description: data.description || undefined,
          //   adminDescription: data.adminDescription || undefined,
          //   planName: data.servicePlanName || undefined,
          // });
          
          const subscriptionResult = await createSubscriptionMutation.mutateAsync({
            name: data.subscriptionName,
            ownerId: parseInt(customerId),
            hostingType: data.hostingType,
            ipAddress: data.ipAddress || undefined,
            // FTP login and password are auto-generated
            description: data.description || undefined,
            adminDescription: data.adminDescription || undefined,
            planName: data.servicePlanName || undefined,
          });
            
            // console.log("Raw subscription creation response:", subscriptionResult);
            // console.log("Parsed subscription creation response:", subscriptionResult.parsed);
          
          // Check if subscription was actually created
          const parsedResult = subscriptionResult.parsed as any;
          // console.log("Looking for subscription ID in:", parsedResult?.packet?.webspace?.add?.result);
          
          const subscriptionId = parsedResult?.packet?.webspace?.add?.result?.id?.["#text"] || 
                                 parsedResult?.packet?.webspace?.add?.result?.id;
          
          // console.log("Extracted subscription ID:", subscriptionId);
          
          if (subscriptionId) {
            subscriptionCreated = true;
            // console.log("Subscription created successfully:", subscriptionId);
            toast.success("Subscription created successfully!");
          } else {
            // console.error("Subscription ID not found in response structure:", parsedResult);
            throw new Error("Subscription ID not found in response");
          }
        } catch (error) {
          // console.error("=== SUBSCRIPTION CREATION ERROR DEBUG ===");
          // console.error("Error object:", error);
          // console.error("Error message:", error.message);
          // console.error("Error stack:", error.stack);
          
          // Check if it's a tRPC error with more details
          if (error && typeof error === 'object') {
            // console.error("Error details:", JSON.stringify(error, null, 2));
            
            // Check for tRPC error structure
            if ('data' in error) {
              // console.error("tRPC error data:", error.data);
            }
            if ('message' in error) {
              // console.error("tRPC error message:", error.message);
            }
            if ('code' in error) {
              // console.error("tRPC error code:", error.code);
            }
          }
          
          toast.error("Failed to create subscription", {
            description: "Please check the subscription details and try again.",
          });
          setIsSubmitting(false);
          return;
        }
      }
      
      // Only proceed if both customer and subscription were created successfully
      if (customerCreated && subscriptionCreated) {
        // Prepare order data for localStorage
      const orderData = {
          id: `order_${Date.now()}`, // Generate unique ID
        orderNumber: data.orderNumber,
        companyName: data.companyName,
        date: new Date(data.date).toISOString(),
        paymentStatus: data.paymentStatus,
        totalAmount: data.totalAmount,
        status: data.status,
          servicePlanId: data.servicePlanId.toString(),
          servicePlanName: data.servicePlanName,
          customerId: customerId,
          customerName: customerName,
          subscriptionName: data.subscriptionName,
          hostingType: data.hostingType,
          createdAt: new Date().toISOString(),
        };

        // Save to localStorage
        try {
          const existingOrders = JSON.parse(localStorage.getItem('orders') || '[]');
          existingOrders.push(orderData);
          localStorage.setItem('orders', JSON.stringify(existingOrders));
          // console.log("Order saved to localStorage:", orderData);
        } catch (storageError) {
          // console.error("Failed to save order to localStorage:", storageError);
          toast.error("Failed to save order locally", {
            description: "Order was created on Plesk but not saved locally.",
          });
          setIsSubmitting(false);
          return;
        }

        // Call the parent callback
      onAddOrder(orderData);
      
      toast.success("Order created successfully!");
      form.reset();
      onOpenChange(false);
      } else {
        toast.error("Failed to create order", {
          description: "Customer or subscription creation failed.",
        });
      }
    } catch (error) {
      // console.error("Error creating order:", error);
      toast.error("Failed to create order", {
        description: "Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto">
        <SheetHeader className="mb-6 flex justify-between items-center flex-row">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-primary/10 rounded-full">
              <ShoppingCart className="h-6 w-6 text-primary" />
            </div>
            <div>
              <SheetTitle className="text-2xl font-bold">Add Order</SheetTitle>
              <SheetDescription className="text-base">
                Create a new order
              </SheetDescription>
            </div>
          </div>
          <SheetClose asChild>
            <Button
              size="icon"
              variant="ghost"
              className="p-0 m-0 size-auto hover:bg-transparent"
            >
              <XIcon className="size-5" />
            </Button>
          </SheetClose>
        </SheetHeader>

        <div className="px-1 pb-1">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Service Plan Selection */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <ShoppingCart className="h-5 w-5" />
                    Service Plan
                  </CardTitle>
                  <CardDescription>Select the service plan for this order</CardDescription>
                </CardHeader>
                <CardContent>
                  <FormField
                    control={form.control}
                    name="servicePlanId"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Service Plan</FormLabel>
                        <Popover open={servicePlanOpen} onOpenChange={setServicePlanOpen}>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                role="combobox"
                                aria-expanded={servicePlanOpen}
                                className="w-full justify-between"
                                disabled={isLoadingServicePlans}
                              >
                                {isLoadingServicePlans ? (
                                  <div className="flex items-center gap-2">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    <span>Loading service plans...</span>
                                  </div>
                                ) : field.value ? (
                                  servicePlans.find((plan) => plan.id === field.value)?.name || "Select service plan"
                                ) : (
                                  "Select service plan"
                                )}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-full p-0">
                            <Command>
                              <CommandInput placeholder="Search service plans..." />
                              <CommandList>
                                <CommandEmpty>No service plans found.</CommandEmpty>
                                <CommandGroup>
                                  {servicePlans.map((plan) => (
                                    <CommandItem
                                      key={plan.id}
                                      value={plan.name}
                                      onSelect={() => {
                                        form.setValue("servicePlanId", plan.id);
                                        form.setValue("servicePlanName", plan.name);
                                        setServicePlanOpen(false);
                                      }}
                                    >
                                      <Check
                                        className={cn(
                                          "mr-2 h-4 w-4",
                                          field.value === plan.id ? "opacity-100" : "opacity-0"
                                        )}
                                      />
                                      <div className="flex flex-col">
                                        <span className="font-medium">{plan.name}</span>
                                        {plan.description && (
                                          <span className="text-sm text-muted-foreground">{plan.description}</span>
                                        )}
                                      </div>
                                    </CommandItem>
                                  ))}
                                </CommandGroup>
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Customer Selection */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <ShoppingCart className="h-5 w-5" />
                    Customer Information
                  </CardTitle>
                  <CardDescription>Select or create a customer for this order</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Customer Type Selection */}
                  <FormField
                    control={form.control}
                    name="customerType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Customer Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select customer type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="existing">Existing Customer</SelectItem>
                            <SelectItem value="new">New Customer</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Existing Customer Selection */}
                  {customerType === "existing" && (
                    <FormField
                      control={form.control}
                      name="existingCustomerId"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Select Customer</FormLabel>
                          <Popover open={customerOpen} onOpenChange={setCustomerOpen}>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant="outline"
                                  role="combobox"
                                  aria-expanded={customerOpen}
                                  className="w-full justify-between"
                                  disabled={isLoadingCustomers}
                                >
                                  {isLoadingCustomers ? (
                                    <div className="flex items-center gap-2">
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                      <span>Loading customers...</span>
                                    </div>
                                  ) : field.value ? (
                                    customers.find((customer) => customer && customer.id === field.value)?.name || "Select customer"
                                  ) : (
                                    "Select customer"
                                  )}
                                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-full p-0">
                              <Command>
                                <CommandInput placeholder="Search customers..." />
                                <CommandList>
                                  <CommandEmpty>No customers found.</CommandEmpty>
                                  <CommandGroup>
                                    {customers.filter(customer => customer).map((customer) => (
                                      <CommandItem
                                        key={customer!.id}
                                        value={`${customer!.name} ${customer!.email} ${customer!.company}`}
                                        onSelect={() => {
                                          // console.log("=== CUSTOMER SELECTION DEBUG ===");
                                          // console.log("Selected customer:", customer);
                                          // console.log("Customer ID:", customer.id);
                                          // console.log("Customer ID type:", typeof customer.id);
                                          form.setValue("existingCustomerId", customer!.id);
                                          form.setValue("existingCustomerName", customer!.name);
                                          setCustomerOpen(false);
                                        }}
                                      >
                                        <Check
                                          className={cn(
                                            "mr-2 h-4 w-4",
                                            field.value === customer!.id ? "opacity-100" : "opacity-0"
                                          )}
                                        />
                                        <div className="flex flex-col">
                                          <span className="font-medium">{customer!.name}</span>
                                          {customer!.email && (
                                            <span className="text-sm text-muted-foreground">{customer!.email}</span>
                                          )}
                                          {customer!.company && (
                                            <span className="text-sm text-muted-foreground">{customer!.company}</span>
                                          )}
                                        </div>
                                      </CommandItem>
                                    ))}
                                  </CommandGroup>
                                </CommandList>
                              </Command>
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  {/* New Customer Form */}
                  {customerType === "new" && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="newCustomerName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Customer Name *</FormLabel>
                              <FormControl>
                                <Input placeholder="John Doe" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="newCustomerEmail"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email *</FormLabel>
                              <FormControl>
                                <Input placeholder="john@example.com" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="newCustomerPhone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Phone</FormLabel>
                              <FormControl>
                                <Input placeholder="+1 (555) 123-4567" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="newCustomerCompany"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Company</FormLabel>
                              <FormControl>
                                <Input placeholder="Acme Corp" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <FormField
                        control={form.control}
                        name="newCustomerAddress"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Address</FormLabel>
                            <FormControl>
                              <Input placeholder="123 Main St" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="grid grid-cols-3 gap-4">
                        <FormField
                          control={form.control}
                          name="newCustomerCity"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>City</FormLabel>
                              <FormControl>
                                <Input placeholder="New York" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="newCustomerState"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>State</FormLabel>
                              <FormControl>
                                <Input placeholder="NY" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="newCustomerPostCode"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Postal Code</FormLabel>
                              <FormControl>
                                <Input placeholder="10001" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <FormField
                        control={form.control}
                        name="newCustomerCountry"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Country</FormLabel>
                            <FormControl>
                              <Input placeholder="United States" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Subscription Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Server className="h-5 w-5" />
                    Subscription Details
                  </CardTitle>
                  <CardDescription>Configure the hosting subscription</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Domain Name */}
                  <FormField
                    control={form.control}
                    name="subscriptionName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Domain Name *</FormLabel>
                        <FormControl>
                          <Input placeholder="example.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Hosting Type */}
                  <FormField
                    control={form.control}
                    name="hostingType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Hosting Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select hosting type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="vrt_hst">Virtual Hosting</SelectItem>
                            <SelectItem value="standard">Standard</SelectItem>
                            <SelectItem value="none">None</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* IP Address */}
                  <FormField
                    control={form.control}
                    name="ipAddress"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>IP Address</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select IP Address" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="23.92.70.234">23.92.70.234</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* FTP Credentials are auto-generated */}

                  {/* Descriptions */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Input placeholder="Customer-facing description" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="adminDescription"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Admin Description</FormLabel>
                          <FormControl>
                            <Input placeholder="Internal admin notes" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Order Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <ShoppingCart className="h-5 w-5" />
                    Order Information
                  </CardTitle>
                  <CardDescription>Basic order details</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="orderNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Order Number</FormLabel>
                        <FormControl>
                          <Input placeholder="ORD-2024-001" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="companyName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Company Name</FormLabel>
                        <FormControl>
                          <Input placeholder="TechCorp Solutions" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Order Date</FormLabel>
                        <FormControl>
                          <DatePicker
                            value={field.value ? new Date(field.value) : undefined}
                            onChange={(date) => field.onChange(date ? date.toISOString().split('T')[0] : "")}
                            placeholder="Select order date"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="totalAmount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Total Amount</FormLabel>
                          <FormControl>
                            <Input 
                              type="number"
                              step="0.01"
                              placeholder="1250.00" 
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="paymentStatus"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Payment Status</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select payment status" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="pending">Pending</SelectItem>
                              <SelectItem value="paid">Paid</SelectItem>
                              <SelectItem value="failed">Failed</SelectItem>
                              <SelectItem value="refunded">Refunded</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Order Status</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select order status" />
                            </SelectTrigger>
                          </FormControl>
                            <SelectContent>
                              <SelectItem value="pending">Pending</SelectItem>
                              <SelectItem value="processing">Processing</SelectItem>
                              <SelectItem value="active">Active</SelectItem>
                              <SelectItem value="suspended">Suspended</SelectItem>
                              <SelectItem value="cancelled">Cancelled</SelectItem>
                            </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              <SheetFooter className="flex gap-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => onOpenChange(false)}
                  disabled={isSubmitting || isLoadingData}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting || isLoadingData}>
                  {isSubmitting ? (
                    <div className="flex items-center gap-2">
                      <Spinner variant="ellipsis" className="text-primary-foreground" size="sm" />
                      <span>Creating...</span>
                    </div>
                  ) : isLoadingData ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Loading...</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Plus className="h-4 w-4" />
                      <span>Add Order</span>
                    </div>
                  )}
                </Button>
              </SheetFooter>
            </form>
          </Form>
        </div>
      </SheetContent>
    </Sheet>
  );
}

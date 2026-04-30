"use client";

import * as React from "react";
import { 
  HardDrive, 
  Plus, 
  Clock, 
  MoreHorizontal, 
  Trash2, 
  ArrowUpCircle, 
  RefreshCw,
  AlertTriangle,
  Calendar,
  Globe,
  Database,
  History,
  Info
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/utils/trpc";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface VpsStorageProps {
  deviceId: number;
  facilityCode?: string;
}

export function VpsStorage({ deviceId, facilityCode }: VpsStorageProps) {
  const utils = trpc.useUtils();

  // Queries
  const volumesQuery = trpc.hivelocity.getVpsVolumes.useQuery({ deviceId });
  const schedulesQuery = trpc.hivelocity.getVpsSnapshotSchedules.useQuery({ deviceId });
  const snapshotsQuery = trpc.hivelocity.getVpsSnapshots.useQuery(
    { facilityCode: facilityCode || "" },
    { enabled: !!facilityCode }
  );

  // Mutations
  const createVolumeMutation = trpc.hivelocity.createVpsVolume.useMutation({
    onSuccess: () => {
      toast.success("Volume creation task initiated");
      utils.hivelocity.getVpsVolumes.invalidate({ deviceId });
      setIsCreateVolumeOpen(false);
    },
    onError: (err) => toast.error(`Failed to create volume: ${err.message}`)
  });

  const resizeVolumeMutation = trpc.hivelocity.resizeVpsVolume.useMutation({
    onSuccess: () => {
      toast.success("Volume resize task initiated");
      utils.hivelocity.getVpsVolumes.invalidate({ deviceId });
      setIsResizeVolumeOpen(false);
    },
    onError: (err) => toast.error(`Failed to resize volume: ${err.message}`)
  });

  const deleteVolumeMutation = trpc.hivelocity.deleteVpsVolume.useMutation({
    onSuccess: () => {
      toast.success("Volume deletion task initiated");
      utils.hivelocity.getVpsVolumes.invalidate({ deviceId });
    },
    onError: (err) => toast.error(`Failed to delete volume: ${err.message}`)
  });

  const createScheduleMutation = trpc.hivelocity.createVpsSnapshotSchedule.useMutation({
    onSuccess: () => {
      toast.success("Snapshot schedule created successfully");
      utils.hivelocity.getVpsSnapshotSchedules.invalidate({ deviceId });
      setIsCreateScheduleOpen(false);
    },
    onError: (err) => toast.error(`Failed to create schedule: ${err.message}`)
  });

  const deleteScheduleMutation = trpc.hivelocity.deleteVpsSnapshotSchedule.useMutation({
    onSuccess: () => {
      toast.success("Snapshot policy removed");
      utils.hivelocity.getVpsSnapshotSchedules.invalidate({ deviceId });
    },
    onError: (err) => toast.error(`Failed to remove policy: ${err.message}`)
  });

  const createSnapshotMutation = trpc.hivelocity.createVpsSnapshot.useMutation({
    onSuccess: () => {
      toast.success("Manual snapshot task initiated");
      utils.hivelocity.getVpsSnapshots.invalidate({ facilityCode: facilityCode || "" });
      setIsCreateSnapshotOpen(false);
    },
    onError: (err) => toast.error(`Failed to create snapshot: ${err.message}`)
  });

  const restoreSnapshotMutation = trpc.hivelocity.restoreVpsSnapshot.useMutation({
    onSuccess: () => toast.success("Volume restoration task initiated"),
    onError: (err) => toast.error(`Restoration failed: ${err.message}`)
  });

  const deleteSnapshotMutation = trpc.hivelocity.deleteVpsSnapshot.useMutation({
    onSuccess: () => {
      toast.success("Snapshot deletion task initiated");
      utils.hivelocity.getVpsSnapshots.invalidate({ facilityCode: facilityCode || "" });
    },
    onError: (err) => toast.error(`Deletion failed: ${err.message}`)
  });

  // State
  const [isCreateVolumeOpen, setIsCreateVolumeOpen] = React.useState(false);
  const [isResizeVolumeOpen, setIsResizeVolumeOpen] = React.useState(false);
  const [isCreateScheduleOpen, setIsCreateScheduleOpen] = React.useState(false);
  const [isCreateSnapshotOpen, setIsCreateSnapshotOpen] = React.useState(false);
  const [selectedVolume, setSelectedVolume] = React.useState<any>(null);

  // Form State
  const [volumeSize, setVolumeSize] = React.useState("50");
  const [snapshotName, setSnapshotName] = React.useState("");
  const [scheduleData, setScheduleData] = React.useState({
    volumeId: "",
    intervalType: "DAILY" as const,
    timezone: "UTC",
    hour: 0,
    minute: 0,
    day: 1,
    weekday: 1,
    maxSnapshots: 7
  });

  const volumes = (volumesQuery.data?.data as any[]) || [];
  const schedules = (schedulesQuery.data?.data as any[]) || [];
  const snapshots = (snapshotsQuery.data?.data as any[]) || [];

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 GB";
    const gib = bytes / (1024 * 1024 * 1024);
    return `${Math.round(gib)} GB`;
  };

  const handleCreateVolume = () => {
    createVolumeMutation.mutate({
      deviceId,
      size: parseInt(volumeSize, 10)
    });
  };

  const handleResizeVolume = (vol: any) => {
    setSelectedVolume(vol);
    setIsResizeVolumeOpen(true);
  };

  const handleCreateSnapshot = () => {
    if (!facilityCode || !selectedVolume) return;
    createSnapshotMutation.mutate({
      volumeId: selectedVolume.volumeId,
      name: snapshotName.trim() || `Manual-${format(new Date(), "yyyyMMdd-HHmm")}`,
      facilityCode
    });
  };

  const handleCreateSchedule = () => {
    if (!facilityCode) {
      toast.error("Facility code missing. Please refresh.");
      return;
    }
    createScheduleMutation.mutate({
      ...scheduleData,
      facilityCode
    });
  };

  return (
    <div className="space-y-8">
      {/* Volumes Section */}
      <Card className="border-border/40 shadow-sm overflow-hidden">
        <CardHeader className="bg-muted/30 pb-4">
          <div className="flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle className="flex items-center gap-2 text-base">
                <HardDrive className="h-5 w-5 text-primary" />
                Infrastructure Storage
              </CardTitle>
              <CardDescription>Block storage volumes attached to this compute instance</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline"
                size="sm" 
                onClick={() => setIsCreateSnapshotOpen(true)}
                className="h-8 gap-2 font-bold text-[10px] uppercase tracking-wider"
              >
                <Plus className="h-3.5 w-3.5" />
                Manual Snapshot
              </Button>
              <Dialog open={isCreateVolumeOpen} onOpenChange={setIsCreateVolumeOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="h-8 gap-2 bg-primary font-bold text-[10px] uppercase tracking-wider">
                    <Plus className="h-3.5 w-3.5" />
                    Provision Volume
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Provision New Volume</DialogTitle>
                    <DialogDescription>
                      Add additional SSD storage to your instance. Monthly billing will apply immediately.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-6 py-4">
                    <div className="space-y-2">
                      <Label className="text-[10px] uppercase font-bold text-muted-foreground">Select capacity</Label>
                      <Select value={volumeSize} onValueChange={setVolumeSize}>
                        <SelectTrigger className="h-11 font-bold text-sm">
                          <SelectValue placeholder="Select size" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="50">50 GB SSD</SelectItem>
                          <SelectItem value="100">100 GB SSD</SelectItem>
                          <SelectItem value="200">200 GB SSD</SelectItem>
                          <SelectItem value="500">500 GB SSD</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Alert variant="warning" className="bg-amber-500/5 border-amber-500/20 py-3">
                      <AlertTriangle className="h-4 w-4 text-amber-600" />
                      <AlertDescription className="text-[10px] font-medium text-amber-700 leading-relaxed opacity-80">
                        Volumes are billed monthly regardless of the instance billing cycle. Data is persistent across reboots.
                      </AlertDescription>
                    </Alert>
                  </div>
                  <DialogFooter>
                    <Button variant="ghost" onClick={() => setIsCreateVolumeOpen(false)} className="font-bold text-[10px] uppercase tracking-wider">Cancel</Button>
                    <Button 
                      onClick={handleCreateVolume} 
                      disabled={createVolumeMutation.isPending}
                      className="font-bold text-[10px] uppercase tracking-wider px-8"
                    >
                      {createVolumeMutation.isPending ? <RefreshCw className="h-3 w-3 animate-spin mr-2" /> : <Plus className="h-3 w-3 mr-2" />}
                      Confirm Provisioning
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>

        {/* Create Snapshot Dialog */}
        <Dialog open={isCreateSnapshotOpen} onOpenChange={setIsCreateSnapshotOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Create Recovery Snapshot</DialogTitle>
              <DialogDescription>
                Create a point-in-time copy of your volume's data.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-6 py-4">
              <div className="space-y-2">
                <Label className="text-[10px] uppercase font-bold text-muted-foreground">Select target volume</Label>
                <Select 
                  value={selectedVolume?.volumeId} 
                  onValueChange={(v) => setSelectedVolume(volumes.find(vol => vol.volumeId === v))}
                >
                  <SelectTrigger className="h-11 font-bold text-sm">
                    <SelectValue placeholder="Select target volume" />
                  </SelectTrigger>
                  <SelectContent>
                    {volumes.map(vol => (
                      <SelectItem key={vol.volumeId} value={vol.volumeId}>
                        {vol.type} ({formatBytes(vol.size)})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] uppercase font-bold text-muted-foreground">Snapshot name (optional)</Label>
                <Input 
                  placeholder="e.g. Pre-Update-Backup" 
                  value={snapshotName}
                  onChange={(e) => setSnapshotName(e.target.value)}
                  className="h-11 font-bold text-sm"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setIsCreateSnapshotOpen(false)} className="font-bold text-[10px] uppercase tracking-wider">Cancel</Button>
              <Button 
                onClick={handleCreateSnapshot}
                disabled={createSnapshotMutation.isPending || !selectedVolume}
                className="font-bold text-[10px] uppercase tracking-wider px-8"
              >
                {createSnapshotMutation.isPending ? <RefreshCw className="h-3 w-3 animate-spin mr-2" /> : <Plus className="h-3 w-3 mr-2" />}
                Create Snapshot
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Resize Volume Dialog */}
        <Dialog open={isResizeVolumeOpen} onOpenChange={setIsResizeVolumeOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Expand Volume Capacity</DialogTitle>
              <DialogDescription>
                Select a new capacity for volume <span className="text-primary">{selectedVolume?.volumeId?.split('-')[0]}</span>. Capacity can only be increased.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-6 py-4">
              <div className="space-y-2">
                <Label className="text-[10px] uppercase font-bold text-muted-foreground">Select new size</Label>
                <AvailableSizesSelect 
                  volumeId={selectedVolume?.volumeId} 
                  onSelect={(size) => setVolumeSize(String(size))} 
                />
              </div>
              <Alert className="bg-primary/5 border-primary/20">
                <Info className="h-4 w-4 text-primary" />
                <AlertDescription className="text-[10px] font-medium leading-relaxed opacity-80">
                  Resizing may take several minutes. You may need to expand the partition within your OS after the task completes.
                </AlertDescription>
              </Alert>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setIsResizeVolumeOpen(false)} className="font-bold text-[10px] uppercase tracking-wider">Cancel</Button>
              <Button 
                onClick={() => resizeVolumeMutation.mutate({ volumeId: selectedVolume.volumeId, size: parseInt(volumeSize, 10), deviceId })}
                disabled={resizeVolumeMutation.isPending || !volumeSize}
                className="font-bold text-[10px] uppercase tracking-wider px-8"
              >
                {resizeVolumeMutation.isPending ? <RefreshCw className="h-3 w-3 animate-spin mr-2" /> : <ArrowUpCircle className="h-3 w-3 mr-2" />}
                Execute Expansion
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/10">
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-[9px] font-bold uppercase pl-6">Disk identity</TableHead>
                <TableHead className="text-[9px] font-bold uppercase text-center">Type</TableHead>
                <TableHead className="text-[9px] font-bold uppercase text-center">Capacity</TableHead>
                <TableHead className="text-[9px] font-bold uppercase text-center">Lifecycle</TableHead>
                <TableHead className="text-[9px] font-bold uppercase text-right pr-6">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {volumesQuery.isLoading ? (
                [1, 2].map((i) => (
                  <TableRow key={i}>
                    <TableCell className="pl-6"><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-16 mx-auto" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-12 mx-auto" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24 mx-auto" /></TableCell>
                    <TableCell className="pr-6"><Skeleton className="h-8 w-8 ml-auto rounded-full" /></TableCell>
                  </TableRow>
                ))
              ) : volumes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-16">
                    <Database className="h-10 w-10 mx-auto mb-4 opacity-10" />
                    <p className="text-sm font-bold uppercase tracking-widest opacity-40">Registry empty</p>
                  </TableCell>
                </TableRow>
              ) : (
                volumes.map((vol: any) => (
                  <TableRow key={vol.volumeId} className="group hover:bg-primary/5 transition-colors">
                    <TableCell className="pl-6 py-4">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[10px] font-bold uppercase text-foreground/80">{vol.volumeId.split('-')[0]}...</span>
                        <span className="text-[9px] text-muted-foreground opacity-60 uppercase">{vol.volumeId}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className={`text-[9px] font-bold h-5 px-2 ${vol.type === 'ROOT' ? 'bg-primary/5 border-primary/20 text-primary' : 'bg-muted border-border text-muted-foreground'}`}>
                        {vol.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="text-xs font-bold text-primary/80">{formatBytes(vol.size)}</span>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="text-[10px] font-medium text-muted-foreground">
                        {vol.createdAt ? format(new Date(vol.createdAt), "MMM d, yyyy") : "—"}
                      </span>
                    </TableCell>
                    <TableCell className="pr-6 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-primary/10">
                            <MoreHorizontal className="h-4 w-4 text-primary/60" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem onClick={() => handleResizeVolume(vol)} className="gap-2 font-bold text-[10px] uppercase py-2">
                            <ArrowUpCircle className="h-3.5 w-3.5" />
                            Expand Capacity
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => deleteVolumeMutation.mutate({ volumeId: vol.volumeId, deviceId })}
                            disabled={vol.type === 'ROOT'}
                            className="gap-2 font-bold text-[10px] uppercase py-2 text-destructive focus:text-destructive"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            Terminate Volume
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Snapshot Schedules Section */}
      <Card className="border-border/40 shadow-sm overflow-hidden">
        <CardHeader className="bg-muted/30 pb-4 border-b border-border/40">
          <div className="flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle className="flex items-center gap-2 text-base">
                <Clock className="h-5 w-5 text-primary" />
                Automated Protection
              </CardTitle>
              <CardDescription>Scheduled snapshot policies for data redundancy</CardDescription>
            </div>
            <Dialog open={isCreateScheduleOpen} onOpenChange={setIsCreateScheduleOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 gap-2 bg-background font-bold text-[10px] uppercase tracking-wider">
                  <Plus className="h-3.5 w-3.5" />
                  Define Schedule
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Automated Snapshot Configuration</DialogTitle>
                  <DialogDescription>
                    Configure recurring snapshot tasks for a specific volume.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-6 py-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-[10px] uppercase font-bold text-muted-foreground">Target volume</Label>
                      <Select 
                        value={scheduleData.volumeId} 
                        onValueChange={(v) => setScheduleData(prev => ({ ...prev, volumeId: v }))}
                      >
                        <SelectTrigger className="font-bold text-xs h-10">
                          <SelectValue placeholder="Select Volume" />
                        </SelectTrigger>
                        <SelectContent>
                          {volumes.map(vol => (
                            <SelectItem key={vol.volumeId} value={vol.volumeId}>
                              {vol.type} ({formatBytes(vol.size)})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] uppercase font-bold text-muted-foreground">Interval</Label>
                      <Select 
                        value={scheduleData.intervalType} 
                        onValueChange={(v: any) => setScheduleData(prev => ({ ...prev, intervalType: v }))}
                      >
                        <SelectTrigger className="font-bold text-xs h-10">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="HOURLY">Hourly</SelectItem>
                          <SelectItem value="DAILY">Daily</SelectItem>
                          <SelectItem value="WEEKLY">Weekly</SelectItem>
                          <SelectItem value="MONTHLY">Monthly</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-[10px] uppercase font-bold text-muted-foreground">Retention limit</Label>
                      <Input 
                        type="number" 
                        min="1" 
                        max="20"
                        value={scheduleData.maxSnapshots}
                        onChange={(e) => setScheduleData(prev => ({ ...prev, maxSnapshots: parseInt(e.target.value, 10) }))}
                        className="h-10 font-bold text-xs"
                      />
                      <p className="text-[9px] text-muted-foreground italic">Snapshots to keep (max 20)</p>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] uppercase font-bold text-muted-foreground">Timezone</Label>
                      <Select 
                        value={scheduleData.timezone} 
                        onValueChange={(v) => setScheduleData(prev => ({ ...prev, timezone: v }))}
                      >
                        <SelectTrigger className="font-bold text-xs h-10">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="UTC">UTC (Universal)</SelectItem>
                          <SelectItem value="Africa/Nairobi">EAT (Nairobi)</SelectItem>
                          <SelectItem value="America/New_York">EST (New York)</SelectItem>
                          <SelectItem value="Europe/London">GMT (London)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {scheduleData.intervalType !== "HOURLY" && (
                    <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-1">
                      <div className="space-y-2">
                        <Label className="text-[10px] uppercase font-bold text-muted-foreground">Hour (0-23)</Label>
                        <Input 
                          type="number" 
                          min="0" max="23"
                          value={scheduleData.hour}
                          onChange={(e) => setScheduleData(prev => ({ ...prev, hour: parseInt(e.target.value, 10) }))}
                          className="h-10 font-bold text-xs"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] uppercase font-bold text-muted-foreground">Minute (0-59)</Label>
                        <Input 
                          type="number" 
                          min="0" max="59"
                          value={scheduleData.minute}
                          onChange={(e) => setScheduleData(prev => ({ ...prev, minute: parseInt(e.target.value, 10) }))}
                          className="h-10 font-bold text-xs"
                        />
                      </div>
                    </div>
                  )}

                  {scheduleData.intervalType === "WEEKLY" && (
                    <div className="space-y-2 animate-in fade-in slide-in-from-top-1">
                      <Label className="text-[10px] uppercase font-bold text-muted-foreground">Day of week</Label>
                      <Select 
                        value={String(scheduleData.weekday)} 
                        onValueChange={(v) => setScheduleData(prev => ({ ...prev, weekday: parseInt(v, 10) }))}
                      >
                        <SelectTrigger className="font-bold text-xs h-10">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">Monday</SelectItem>
                          <SelectItem value="2">Tuesday</SelectItem>
                          <SelectItem value="3">Wednesday</SelectItem>
                          <SelectItem value="4">Thursday</SelectItem>
                          <SelectItem value="5">Friday</SelectItem>
                          <SelectItem value="6">Saturday</SelectItem>
                          <SelectItem value="7">Sunday</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {scheduleData.intervalType === "MONTHLY" && (
                    <div className="space-y-2 animate-in fade-in slide-in-from-top-1">
                      <Label className="text-[10px] uppercase font-bold text-muted-foreground">Day of month (1-28)</Label>
                      <Input 
                        type="number" 
                        min="1" max="28"
                        value={scheduleData.day}
                        onChange={(e) => setScheduleData(prev => ({ ...prev, day: parseInt(e.target.value, 10) }))}
                        className="h-10 font-bold text-xs"
                      />
                    </div>
                  )}
                </div>
                <DialogFooter className="bg-muted/30 -mx-6 -mb-6 p-6">
                  <Button variant="ghost" onClick={() => setIsCreateScheduleOpen(false)} className="font-bold text-[10px] uppercase tracking-wider">Cancel</Button>
                  <Button 
                    onClick={handleCreateSchedule}
                    disabled={createScheduleMutation.isPending || !scheduleData.volumeId}
                    className="font-bold text-[10px] uppercase tracking-wider px-8"
                  >
                    {createScheduleMutation.isPending ? <RefreshCw className="h-3.5 w-3.5 animate-spin mr-2" /> : <Clock className="h-3.5 w-3.5 mr-2" />}
                    Enable Protection
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-border/40">
            {schedulesQuery.isLoading ? (
              <div className="p-6 space-y-4">
                <Skeleton className="h-16 w-full rounded-xl" />
                <Skeleton className="h-16 w-full rounded-xl" />
              </div>
            ) : schedules.length === 0 ? (
              <div className="p-16 text-center text-muted-foreground flex flex-col items-center justify-center">
                <div className="h-12 w-12 rounded-full bg-primary/5 flex items-center justify-center mb-4">
                  <Calendar className="h-6 w-6 text-primary/40" />
                </div>
                <p className="text-sm font-bold uppercase tracking-widest opacity-40">No policies configured</p>
                <p className="text-[10px] font-medium max-w-[240px] mt-2 opacity-60">Scheduled snapshots provide automated recovery points for your critical block storage.</p>
              </div>
            ) : (
              schedules.map((schedule: any, idx: number) => (
                <div key={idx} className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-6 hover:bg-muted/5 transition-colors">
                  <div className="flex items-start gap-4">
                    <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <Clock className="h-5 w-5 text-primary" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold uppercase">{schedule.intervalType} policy</h4>
                        <Badge variant="outline" className="text-[9px] font-bold h-4 px-2 bg-emerald-500/10 text-emerald-600 border-emerald-500/20">ACTIVE</Badge>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-muted-foreground font-medium">
                        <span className="flex items-center gap-1">
                          <Database className="h-3 w-3" />
                          Vol: <span className="text-foreground font-bold">{schedule.volumeId.split('-')[0]}...</span>
                        </span>
                        <span className="flex items-center gap-1">
                          <RefreshCw className="h-3 w-3" />
                          Retention: <span className="text-foreground font-bold">{schedule.maxSnapshots} units</span>
                        </span>
                        <span className="flex items-center gap-1">
                          <Globe className="h-3 w-3" />
                          TZ: <span className="text-foreground font-bold uppercase">{schedule.timezone}</span>
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="bg-muted/30 border border-border/60 rounded-lg p-3 px-4 min-w-[140px]">
                      <p className="text-[9px] text-muted-foreground uppercase font-bold mb-1">Execution window</p>
                      <p className="text-xs font-bold">
                        {schedule.intervalType === 'HOURLY' ? (
                          "Top of every hour"
                        ) : (
                          `${String(schedule.hour).padStart(2, '0')}:${String(schedule.minute).padStart(2, '0')} ${schedule.timezone}`
                        )}
                      </p>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-9 w-9">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem 
                          onClick={() => deleteScheduleMutation.mutate({ snapshotScheduleId: schedule.snapshotScheduleId, facilityCode: facilityCode! })}
                          className="text-destructive font-bold text-[10px] uppercase"
                        >
                          Disable Policy
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Snapshots History Section */}
      <Card className="border-border/40 shadow-sm overflow-hidden">
        <CardHeader className="bg-muted/30 pb-4">
          <div className="flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle className="flex items-center gap-2 text-base">
                <History className="h-5 w-5 text-primary" />
                Recovery Points
              </CardTitle>
              <CardDescription>Available snapshots for restoration or forensics</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/10">
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-[9px] font-bold uppercase pl-6">Snapshot name</TableHead>
                <TableHead className="text-[9px] font-bold uppercase text-center">Status</TableHead>
                <TableHead className="text-[9px] font-bold uppercase text-center">Size</TableHead>
                <TableHead className="text-[9px] font-bold uppercase text-center">Created at</TableHead>
                <TableHead className="text-[9px] font-bold uppercase text-right pr-6">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {snapshotsQuery.isLoading ? (
                [1, 2, 3].map((i) => (
                  <TableRow key={i}>
                    <TableCell className="pl-6"><Skeleton className="h-4 w-48" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-16 mx-auto" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-12 mx-auto" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-32 mx-auto" /></TableCell>
                    <TableCell className="pr-6"><Skeleton className="h-8 w-8 ml-auto rounded-full" /></TableCell>
                  </TableRow>
                ))
              ) : snapshots.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-16">
                    <History className="h-10 w-10 mx-auto mb-4 opacity-10" />
                    <p className="text-sm font-bold uppercase opacity-40">No recovery points</p>
                  </TableCell>
                </TableRow>
              ) : (
                snapshots.map((snap: any) => (
                  <TableRow key={snap.snapshotId} className="group hover:bg-primary/5 transition-colors">
                    <TableCell className="pl-6 py-4">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[10px] font-bold uppercase text-foreground/80">{snap.name || "Untitled snapshot"}</span>
                        <span className="text-[9px] text-muted-foreground opacity-60 uppercase">{snap.snapshotId}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className={`text-[9px] font-bold h-5 px-2 ${snap.state === 'available' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' : 'bg-amber-500/10 text-amber-600 border-amber-500/20'}`}>
                        {snap.state?.toUpperCase() || "PENDING"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="text-xs font-bold text-muted-foreground/80">{formatBytes(snap.size)}</span>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="text-[10px] font-medium text-muted-foreground">
                        {format(new Date(snap.createdAt), "MMM d, yyyy HH:mm")}
                      </span>
                    </TableCell>
                    <TableCell className="pr-6 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-primary/10">
                            <MoreHorizontal className="h-4 w-4 text-primary/60" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem 
                            onClick={() => restoreSnapshotMutation.mutate({ snapshotId: snap.snapshotId, facilityCode: facilityCode! })}
                            className="gap-2 font-bold text-[10px] uppercase py-2 text-primary focus:text-primary"
                          >
                            <RefreshCw className="h-3.5 w-3.5" />
                            Restore Volume
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => deleteSnapshotMutation.mutate({ snapshotId: snap.snapshotId, facilityCode })}
                            className="gap-2 font-bold text-[10px] uppercase py-2 text-destructive focus:text-destructive"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            Purge Snapshot
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Alert className="bg-primary/5 border-primary/20">
        <Info className="h-4 w-4 text-primary" />
        <AlertTitle className="text-xs font-black uppercase tracking-tight">Data Integrity Warning</AlertTitle>
        <AlertDescription className="text-[10px] font-medium leading-relaxed opacity-80 uppercase tracking-tighter">
          Snapshots are point-in-time copies. While they capture the entire disk state, we recommend flushing application-level caches before manual snapshots for maximum consistency.
        </AlertDescription>
      </Alert>
    </div>
  );
}

function AvailableSizesSelect({ volumeId, onSelect }: { volumeId: string; onSelect: (size: number) => void }) {
  const query = trpc.hivelocity.getVpsVolumeAvailableSizes.useQuery({ volumeId }, { 
    enabled: !!volumeId,
    retry: false
  });
  const sizes = (query.data?.data as any)?.volumeProducts || [];

  return (
    <Select onValueChange={(v) => onSelect(parseInt(v, 10))}>
      <SelectTrigger className="h-11 font-bold text-sm">
        <SelectValue placeholder={
          query.isLoading ? "Analyzing options..." : 
          query.isError ? "Expansion unavailable" : 
          "Select new capacity"
        } />
      </SelectTrigger>
      <SelectContent>
        {query.isError ? (
          <div className="p-4 text-center space-y-2">
            <AlertTriangle className="h-4 w-4 mx-auto text-amber-500" />
            <p className="text-[10px] font-bold text-muted-foreground uppercase leading-tight">
              Ineligible for Expansion
            </p>
            <p className="text-[9px] text-muted-foreground/60 leading-normal">
              This volume type or status does not support dynamic expansion via the API.
            </p>
          </div>
        ) : (
          <>
            {sizes.map((item: any) => (
              <SelectItem key={item.size} value={String(item.size)}>
                {item.size} GB SSD — ${item.monthlyPrice}/mo
              </SelectItem>
            ))}
            {!query.isLoading && sizes.length === 0 && (
              <div className="p-2 text-[10px] text-muted-foreground text-center font-bold uppercase">Max capacity reached</div>
            )}
          </>
        )}
      </SelectContent>
    </Select>
  );
}

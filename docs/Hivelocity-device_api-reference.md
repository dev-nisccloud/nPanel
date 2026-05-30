# Hivelocity API Reference: Device & Rack Operations

**Base URL:** `https://core.hivelocity.net/api/v2`  
**Authentication:** All requests require the header `X-API-KEY: <your_api_key>`  
**Spec:** All endpoints conform to the OpenAPI Specification.

---

## Table of Contents

1. [Overview](#overview)
2. [Using Your Device ID](#using-your-device-id)
   - [Device Info & Management](#1-device-info--management)
   - [Power Control](#2-power-control)
   - [OS Reload & Reprovisioning](#3-os-reload--reprovisioning)
   - [IPMI / Out-of-Band Access](#4-ipmi--out-of-band-access)
   - [Layer 2 Networking - Ports & Bonds](#5-layer-2-networking--ports--bonds)
   - [Bandwidth Monitoring](#6-bandwidth-monitoring)
   - [Tags](#7-tags)
   - [Cancellation](#8-cancellation)
   - [VPS/VDS-Specific Endpoints](#9-vpsvds-specific-endpoints)
3. [Using Your Rack ID](#using-your-rack-id)
   - [Rack Info via Device Details](#1-rack-info-via-device-details)
   - [VLANs - The Primary Rack-Scoped Primitive](#2-vlans--the-primary-rack-scoped-primitive)
   - [Bonding - Rack-Aware NIC Aggregation](#3-bonding--rack-aware-nic-aggregation)
   - [Facility & Rack Inventory](#4-facility--rack-inventory)
4. [Endpoint Quick Reference Tables](#endpoint-quick-reference-tables)
5. [Important Notes & Gotchas](#important-notes--gotchas)

---

## Overview

The Hivelocity API gives you programmatic control over every aspect of your infrastructure. It covers all device types - bare metal dedicated servers, Virtual Private Servers (VPS), and Virtual Dedicated Servers (VDS). Where endpoints differ by device type, this document clearly marks the distinction.

**Device types and their API identifiers:**

| Device Type | Deployed via | Managed via |
|---|---|---|
| Instant Bare Metal | `POST /bare-metal-devices` | `/device/{deviceId}` and `/bare-metal-devices/{deviceId}` |
| Virtual Private/Dedicated Server | `POST /vps` | `/device/{deviceId}` and `/vps/{deviceId}` |

> **Note on Rack IDs:** Hivelocity does not expose a standalone `/rack/{rackId}` resource in the public API. Rack context is returned inside device details, and rack-level operations flow through VLANs, bonding, and facility inventory endpoints.

---

## Using Your Device ID

Once you have a `deviceId` (obtained from provisioning, from `GET /device`, or from `GET /device?orderId={orderId}`), you can perform the following operations.

---

### 1. Device Info & Management

These endpoints work across **all device types** (bare metal, VPS, VDS).

---

#### GET `/device/{deviceId}` - Get full device details

Returns complete information about the device including hostname, primary IP, all assigned IPs, power state, product configuration, facility/location, rack ID, rack bonding support flag, tags, and associated services.

```bash
curl -X GET \
  'https://core.hivelocity.net/api/v2/device/{deviceId}' \
  -H 'accept: application/json' \
  -H "X-API-KEY: $API_KEY"
```

**Key fields returned:**
- `id` - the device ID
- `hostname` - current hostname
- `primary_ip` - primary public IP address
- `ip_addresses` - all IPs assigned to the device
- `power_status` - current power state (on, off, pending)
- `product_id` - hardware configuration ID
- `location_name` - facility code (e.g. `TPA1`, `NYC1`)
- `rack_id` - the ID of the rack this device is in
- `tags` - list of tags on the device
- `os_name` - currently installed operating system

---

#### PUT `/device/{deviceId}` - Update device fields

Update mutable fields on the device such as hostname, custom display name, and tags.

```bash
curl -X PUT \
  'https://core.hivelocity.net/api/v2/device/{deviceId}' \
  -H 'accept: application/json' \
  -H 'Content-Type: application/json' \
  -H "X-API-KEY: $API_KEY" \
  -d '{
    "hostname": "new-hostname.example.com",
    "tags": ["web", "production"]
  }'
```

---

#### GET `/device/{deviceId}/initial-creds` - Retrieve initial SSH credentials

Returns the initial SSH username, password, and port generated at provisioning time. These credentials expire **7 days** after the order is placed - after that, the endpoint returns `null` for the password.

```bash
curl -X GET \
  'https://core.hivelocity.net/api/v2/device/{deviceId}/initial-creds' \
  -H 'accept: application/json' \
  -H "X-API-KEY: $API_KEY"
```

**Response fields:**
- `user` - SSH username
- `password` - initial password (null after 7 days)
- `port` - SSH port

---

#### GET `/device/{deviceId}/services` - Get all services on a device

Returns all services (billing line items, add-ons, options) associated with the device. Can be filtered by service type code or returned flat.

```bash
curl -X GET \
  'https://core.hivelocity.net/api/v2/device/{deviceId}/services?group_by=type_code' \
  -H 'accept: application/json' \
  -H "X-API-KEY: $API_KEY"
```

**Query parameters:**
- `group_by` - `type_code` to group by service type, or `flat` (default) for a flat list
- `type_code` - filter to a specific service type; defaults to all types. A full list of service types is available at `/service/types`.

---

### 2. Power Control

Applies to **all device types**.

---

#### POST `/device/{deviceId}/power` - Power on, off, or reboot

Controls the power state of the device. The action is passed in the request body.

```bash
curl -X POST \
  'https://core.hivelocity.net/api/v2/device/{deviceId}/power' \
  -H 'accept: application/json' \
  -H 'Content-Type: application/json' \
  -H "X-API-KEY: $API_KEY" \
  -d '{"action": "reboot"}'
```

**Valid actions:**
- `"on"` - power the device on
- `"off"` - gracefully power the device off
- `"reboot"` - restart the device

> **Important:** A device must be powered off before an OS reload can be initiated. This is a safety check to prevent accidental reloads of the wrong server.

---

### 3. OS Reload & Reprovisioning

---

#### POST `/device/{deviceId}/reload` - Initiate an OS reload (Bare Metal)

Triggers a full OS reload on a bare metal device. The device must already be powered off before you call this endpoint. All data on the device will be destroyed - the reload process does not preserve the filesystem.

```bash
curl -X POST \
  'https://core.hivelocity.net/api/v2/device/{deviceId}/reload' \
  -H 'accept: application/json' \
  -H 'Content-Type: application/json' \
  -H "X-API-KEY: $API_KEY" \
  -d '{
    "osName": "Ubuntu 22.x",
    "hostname": "server.example.com"
  }'
```

> **Custom servers:** For non-instant (custom) bare metal servers, this endpoint creates a support ticket on your behalf. Reloads are typically completed by technicians in under 1 hour, though up to 4 hours is possible if BIOS or networking was modified.

> **Instant servers:** Reloads are automated and complete in approximately 7 minutes for most Linux distributions.

---

#### PUT `/bare-metal-devices/{deviceId}` - Update/reload an instant bare metal device

For instant bare metal servers, use this endpoint to reload the OS or change the hostname. It accepts the same body as the provisioning endpoint.

```bash
curl -X PUT \
  'https://core.hivelocity.net/api/v2/bare-metal-devices/{deviceId}' \
  -H 'accept: application/json' \
  -H 'Content-Type: application/json' \
  -H "X-API-KEY: $API_KEY" \
  -d '{
    "osName": "Debian 11.x",
    "hostname": "new-hostname.example.com"
  }'
```

---

#### DELETE `/bare-metal-devices/{deviceId}` - Permanently delete an instant server

Deprovisions and permanently destroys an instant bare metal device. A secure wipe process begins immediately and the action is irreversible - all data becomes unrecoverable.

```bash
curl -X DELETE \
  'https://core.hivelocity.net/api/v2/bare-metal-devices/{deviceId}' \
  -H 'accept: application/json' \
  -H "X-API-KEY: $API_KEY"
```

> **Warning:** Instant servers are never deleted unless explicitly requested via the portal or API (or due to account termination for Terms of Service violations). There is no soft-delete or recycle bin.

---

### 4. IPMI / Out-of-Band Access

Applies to **bare metal** devices. IPMI (Intelligent Platform Management Interface) provides remote control of the physical server regardless of whether the OS is responsive or the server has network connectivity.

---

#### GET `/device/{deviceId}/ipmi` - Get IPMI credentials and details

Returns the IPMI IP address, username, and password for out-of-band server access. IPMI allows you to remotely view the server console, mount ISOs, check hardware sensors, and control power as if standing in front of the machine.

```bash
curl -X GET \
  'https://core.hivelocity.net/api/v2/device/{deviceId}/ipmi' \
  -H 'accept: application/json' \
  -H "X-API-KEY: $API_KEY"
```

**Response fields:**
- `ipmi_ip` - IPMI management IP address
- `username` - IPMI login username
- `password` - IPMI login password

---

#### POST `/device/{deviceId}/ipmi/whitelist` - Whitelist your IP for IPMI access

Temporarily adds your current public IP to the IPMI network allowlist. Access is granted for **12 hours**. After the window expires you must re-whitelist your IP. This endpoint returns the IPMI public IP.

```bash
curl -X POST \
  'https://core.hivelocity.net/api/v2/device/{deviceId}/ipmi/whitelist/' \
  -H 'accept: application/json' \
  -H "X-API-KEY: $API_KEY"
```

> **Alternative access method:** You can also connect to IPMI via the Hivelocity VPN without needing to whitelist your IP. Instructions are available in the portal under the device's Sensors tab.

---

### 5. Layer 2 Networking - Ports & Bonds

These endpoints control physical switch port configuration. Applies to **all device types**, with bonding limited to **bare metal** in bond-capable racks.

By default, each server has two NIC ports: `eth0` (public) and `eth1` (private). Each port is connected to a separate switch for redundancy. Ports and bonds share the same ID namespace - anywhere you see `portId` in the API, you can pass either a port ID or a bond ID.

---

#### GET `/device/{deviceId}/ports` - Get all ports for a device

Returns all switch ports associated with the device, including current IP subnet assignments, enabled/disabled state, and native VLAN configuration.

```bash
curl -X GET \
  'https://core.hivelocity.net/api/v2/device/{deviceId}/ports' \
  -H 'accept: application/json' \
  -H "X-API-KEY: $API_KEY"
```

**Response fields per port:**
- `portId` - unique port identifier
- `name` - interface name (e.g. `eth0`, `eth1`)
- `enabled` - whether the port is active
- `ipAssignments` - list of subnet IDs currently routed to this port
- `nativeVlanId` - native VLAN ID if set
- `macAddress` - MAC address of the port

---

#### PUT `/device/{deviceId}/ports` - Update port configuration

This is a full-state replacement endpoint. The state you send becomes the exact state of the ports - if you have existing `ipAssignments` and do not include them in the payload, they will be removed. You can use this endpoint to:

- Route an IP subnet to a port
- Remove a subnet from a port
- Enable or disable a port
- Set or clear the native VLAN

```bash
curl -X PUT \
  'https://core.hivelocity.net/api/v2/device/{deviceId}/ports' \
  -H 'accept: application/json' \
  -H 'Content-Type: application/json' \
  -H "X-API-KEY: $API_KEY" \
  -d '{
    "ports": [
      {
        "portId": 456,
        "ipAssignments": ["789"],
        "enabled": true,
        "nativeVlanId": 998
      }
    ]
  }'
```

To remove a subnet, pass an empty array for `ipAssignments`. To remove the native VLAN, pass `null` for `nativeVlanId`.

> **Caution:** Removing an IP assignment from a port will make that IP unreachable. If the removed IP was your primary access IP, the server will become inaccessible over the network. Use IPMI to regain access in that scenario.

---

#### POST `/device/{deviceId}/ports/bond` - Create a bond between NIC ports

Bonds the device's two NIC ports (eth0 and eth1) into a single logical interface. This provides high availability and lets both NICs participate in both Layer 2 and Layer 3 simultaneously - a common pattern for hybrid cloud networking (one side public-facing, the other private).

Only available on devices in **bond-support racks**. The device's rack bonding capability is indicated in the device details response.

```bash
curl -X POST \
  'https://core.hivelocity.net/api/v2/device/{deviceId}/ports/bond' \
  -H 'accept: application/json' \
  -H "X-API-KEY: $API_KEY"
```

After creating the bond via the API, you must also configure the bond (`bond0`) in the server's operating system using your network manager (e.g. `nmcli` on CentOS/RHEL, Netplan on Ubuntu).

---

#### DELETE `/device/{deviceId}/ports/bond` - Break the bond

Returns the device from bonded mode back to two separate independent ports (eth0 and eth1).

```bash
curl -X DELETE \
  'https://core.hivelocity.net/api/v2/device/{deviceId}/ports/bond' \
  -H 'accept: application/json' \
  -H "X-API-KEY: $API_KEY"
```

---

### 6. Bandwidth Monitoring

---

#### POST `/bandwidth/device/{deviceId}` - Get bandwidth usage data for a device

Returns time-series bandwidth data for the specified device over a configurable period. Data is returned as an array of readings with corresponding timestamps.

```bash
curl -X POST \
  'https://core.hivelocity.net/api/v2/bandwidth/device/{deviceId}?period=day&interface=all&step=300' \
  -H 'accept: application/json' \
  -H "X-API-KEY: $API_KEY"
```

**Query parameters:**
- `period` - time period: `hour`, `day`, `week`, `month`
- `interface` - `all`, `public`, or `private`
- `step` - data resolution in seconds (e.g. `300` for 5-minute intervals)

**Response includes:**
- Time-series array of Mbps readings (in/out per interface)
- Total Mbps In/Out transfer summarized for the period
- A `legend` field mapping sub-array indices to interface names

> **Billing recommendation:** For billing-accurate bandwidth data, use `POST /bandwidth/service/{serviceId}` instead of the device endpoint. The service endpoint accounts for device replacements mid-month - if Hivelocity replaces failed hardware and assigns a new `deviceId`, the service endpoint automatically aggregates bandwidth from both the old and new device for that billing period. Devices are also removed from your account after cancellation, while services remain.

---

### 7. Tags

Tags are free-form string labels you can apply to devices for organizational purposes. They are set as part of the device update operation.

---

#### GET `/device/tags` - Get all tags across your account

Returns all tags currently in use across all devices on your client account.

```bash
curl -X GET \
  'https://core.hivelocity.net/api/v2/device/tags' \
  -H 'accept: application/json' \
  -H "X-API-KEY: $API_KEY"
```

---

#### Update tags on a device

Tags are set via the standard device update endpoint. Pass the full list of desired tags - this replaces any existing tags.

```bash
curl -X PUT \
  'https://core.hivelocity.net/api/v2/device/{deviceId}' \
  -H 'Content-Type: application/json' \
  -H "X-API-KEY: $API_KEY" \
  -d '{"tags": ["production", "web", "us-east"]}'
```

---

### 8. Cancellation

---

#### GET `/cancellation/reason/{deviceId}` - Get cancellation reasons for a device

Returns the list of available cancellation reasons specific to the device. These reasons are required when submitting a cancellation request.

```bash
curl -X GET \
  'https://core.hivelocity.net/api/v2/cancellation/reason/{deviceId}' \
  -H 'accept: application/json' \
  -H "X-API-KEY: $API_KEY"
```

---

#### POST `/cancellation` - Submit a cancellation request

Creates a cancellation request for a device service. You must supply the device ID, service ID (from `/device/{deviceId}/services`), and a reason from the list returned above.

```bash
curl -X POST \
  'https://core.hivelocity.net/api/v2/cancellation' \
  -H 'accept: application/json' \
  -H 'Content-Type: application/json' \
  -H "X-API-KEY: $API_KEY" \
  -d '{
    "deviceId": 12345,
    "serviceId": 67890,
    "reason": "No longer needed"
  }'
```

---

### 9. VPS/VDS-Specific Endpoints

The following endpoints apply **exclusively to Virtual Private Servers and Virtual Dedicated Servers**. They use `/vps/{deviceId}` as the base path. The `deviceId` for a VPS is the same ID returned when you provision the VPS or query `GET /device`.

---

#### GET `/vps/{deviceId}` - Get VPS instance details

Returns detailed information about the VPS instance including its status, hardware spec, assigned IPs, and current task state.

```bash
curl -X GET \
  'https://core.hivelocity.net/api/v2/vps/{deviceId}' \
  -H 'accept: application/json' \
  -H "X-API-KEY: $API_KEY"
```

---

#### PUT `/vps/{deviceId}` - Upgrade VPS or update SSH keys

Allows you to scale the VPS to a larger instance size (upgrades only - downgrades are not permitted), or update the SSH keys deployed to the instance. The VPS **must be powered off** before calling this endpoint.

```bash
curl -X PUT \
  'https://core.hivelocity.net/api/v2/vps/{deviceId}' \
  -H 'accept: application/json' \
  -H 'Content-Type: application/json' \
  -H "X-API-KEY: $API_KEY" \
  -d '{
    "productId": 602,
    "sshKeyIds": [1234, 5678]
  }'
```

**Parameters:**
- `productId` - ID of the larger VPS product to upgrade to
- `sshKeyIds` - list of SSH key IDs to deploy (replaces current keys)

---

#### DELETE `/vps/{deviceId}` - Permanently delete the VPS instance

Terminates and destroys the VPS instance. This action is irreversible.

```bash
curl -X DELETE \
  'https://core.hivelocity.net/api/v2/vps/{deviceId}' \
  -H 'accept: application/json' \
  -H "X-API-KEY: $API_KEY"
```

---

#### POST `/vps/{deviceId}/console` - Get one-time browser console URL

Generates a one-time-use URL for KVM console access to the VPS via the browser. This is the VPS equivalent of IPMI - it gives you direct access to the machine even when network connectivity is lost.

```bash
curl -X POST \
  'https://core.hivelocity.net/api/v2/vps/{deviceId}/console' \
  -H 'accept: application/json' \
  -H "X-API-KEY: $API_KEY"
```

**Response:**
```json
{ "url": "https://console.hivelocity.net/..." }
```

The URL is single-use and expires after one session.

---

#### GET `/vps/{deviceId}/events` - Get event log

Returns a chronological log of events for the VPS instance - power state changes, task completions, errors, and system events.

```bash
curl -X GET \
  'https://core.hivelocity.net/api/v2/vps/{deviceId}/events' \
  -H 'accept: application/json' \
  -H "X-API-KEY: $API_KEY"
```

**Response fields per event:**
- `eventId` - unique event identifier
- `type` - event category
- `level` - severity level
- `state` - resulting state after the event
- `createdAt` - timestamp

---

#### GET `/vps/{deviceId}/metrics` - Get performance metrics chart

Returns performance data as a Base64-encoded chart image. Useful for embedding live metric graphs in dashboards or monitoring tools.

```bash
curl -X GET \
  'https://core.hivelocity.net/api/v2/vps/{deviceId}/metrics?metricType=CPU_USAGE' \
  -H 'accept: application/json' \
  -H "X-API-KEY: $API_KEY"
```

**Required query parameter - `metricType`:**
- `CPU_USAGE` - processor utilization over time
- `MEMORY_USAGE` - RAM utilization over time
- `DISK_RW` - disk read/write operations over time
- `NETWORK_USAGE` - network throughput over time

**Optional parameters:**
- `startTime` - Unix timestamp for chart start
- `endTime` - Unix timestamp for chart end
- `imageWidth` - desired chart width in pixels
- `imageHeight` - desired chart height in pixels

**Response:**
```json
{
  "metricType": "CPU_USAGE",
  "startTime": 1700000000,
  "endTime": 1700086400,
  "imageData": "<base64-encoded PNG>"
}
```

---

#### PUT `/vps/{deviceId}/reset-password` - Reset root password

Resets the root/administrator password on the VPS. The VPS **must be powered off** before calling this endpoint.

```bash
curl -X PUT \
  'https://core.hivelocity.net/api/v2/vps/{deviceId}/reset-password' \
  -H 'accept: application/json' \
  -H "X-API-KEY: $API_KEY"
```

---

#### POST `/vps/{deviceId}/attachiso` - Attach an ISO to the VPS

Mounts an ISO image to the VPS instance. The ISO must already exist in the facility (see `/vps/iso` for managing ISOs). Useful for booting rescue environments or installing custom operating systems.

```bash
curl -X POST \
  'https://core.hivelocity.net/api/v2/vps/{deviceId}/attachiso' \
  -H 'accept: application/json' \
  -H 'Content-Type: application/json' \
  -H "X-API-KEY: $API_KEY" \
  -d '{"isoId": "iso-abc123"}'
```

---

#### POST `/vps/{deviceId}/detachiso` - Detach the ISO from the VPS

Unmounts the currently attached ISO from the VPS instance.

```bash
curl -X POST \
  'https://core.hivelocity.net/api/v2/vps/{deviceId}/detachiso' \
  -H 'accept: application/json' \
  -H "X-API-KEY: $API_KEY"
```

---

#### POST `/vps/{deviceId}/volume/{volumeId}/attach` - Attach a volume to the VPS

Attaches an existing block storage volume to the VPS instance. Volumes are managed separately under `/vps/volume`.

```bash
curl -X POST \
  'https://core.hivelocity.net/api/v2/vps/{deviceId}/volume/{volumeId}/attach' \
  -H 'accept: application/json' \
  -H "X-API-KEY: $API_KEY"
```

---

#### POST `/vps/{deviceId}/volume/{volumeId}/detach` - Detach a volume from the VPS

Detaches a block storage volume from the VPS instance without deleting it. The volume can then be attached to another VPS or deleted.

```bash
curl -X POST \
  'https://core.hivelocity.net/api/v2/vps/{deviceId}/volume/{volumeId}/detach' \
  -H 'accept: application/json' \
  -H "X-API-KEY: $API_KEY"
```

---

#### DELETE `/vps/{deviceId}/network/{networkId}` - Detach a VPS network

Removes an attached VPS network from the VPS device.

```bash
curl -X DELETE \
  'https://core.hivelocity.net/api/v2/vps/{deviceId}/network/{networkId}' \
  -H 'accept: application/json' \
  -H "X-API-KEY: $API_KEY"
```

---

#### GET `/vps/volume?deviceId={deviceId}` - List volumes for a VPS

Returns all block storage volumes associated with a specific VPS device. Uses `deviceId` as a query parameter.

```bash
curl -X GET \
  'https://core.hivelocity.net/api/v2/vps/volume?deviceId={deviceId}' \
  -H 'accept: application/json' \
  -H "X-API-KEY: $API_KEY"
```

**Response fields per volume:**
- `volumeId` - unique volume identifier
- `deviceId` - the VPS device the volume is associated with
- `size` - volume size in GB
- `type` - volume type
- `createdAt` - creation timestamp

---

#### GET `/vps/snapshotSchedule?deviceId={deviceId}` - List snapshot schedules for a VPS

Returns all automated snapshot schedules configured for the VPS device.

```bash
curl -X GET \
  'https://core.hivelocity.net/api/v2/vps/snapshotSchedule?deviceId={deviceId}' \
  -H 'accept: application/json' \
  -H "X-API-KEY: $API_KEY"
```

**Response fields per schedule:**
- `snapshotScheduleId`
- `volumeId` - the volume being snapshotted
- `intervalType` - frequency type (hourly, daily, weekly)
- `hour`, `minute`, `weekday`, `day` - schedule timing
- `timezone` - schedule timezone
- `maxSnapshots` - maximum number of snapshots to retain

---

## Using Your Rack ID

The `rackId` for your device is returned as a field inside `GET /device/{deviceId}`. There is no standalone `/rack/{rackId}` endpoint in the Hivelocity public API - rack-level operations are performed through VLANs, bonding configuration, and facility inventory.

---

### 1. Rack Info via Device Details

#### GET `/device/{deviceId}` - Retrieve rack context

The full device response includes the following rack-relevant fields:

| Field | Description |
|---|---|
| `rack_id` | The unique ID of the rack this device is in |
| `bonding_support` | Boolean - whether this rack supports NIC bonding |
| `location_name` | The facility code (e.g. `TPA1`) - each facility contains multiple racks |

---

### 2. VLANs - The Primary Rack-Scoped Primitive

VLANs are the primary mechanism for Layer 2 networking between devices at the rack and facility level. A VLAN creates a private Layer 2 broadcast domain connecting multiple devices - typically within the same rack, but also across racks in the same facility.

---

#### GET `/vlan` - List all VLANs on your account

```bash
curl -X GET \
  'https://core.hivelocity.net/api/v2/vlan' \
  -H 'accept: application/json' \
  -H "X-API-KEY: $API_KEY"
```

Returns all VLANs on your account with their member devices, VLAN ID (802.1Q tag), and facility association.

---

#### POST `/vlan` - Create a new VLAN

Creates a Layer 2 VLAN connecting one or more of your devices. All devices in the VLAN must be in compatible racks at the same facility.

```bash
curl -X POST \
  'https://core.hivelocity.net/api/v2/vlan' \
  -H 'accept: application/json' \
  -H 'Content-Type: application/json' \
  -H "X-API-KEY: $API_KEY" \
  -d '{
    "device_ids": [11111, 22222, 33333]
  }'
```

After creating the VLAN via the API, you route it to the device's ports using `PUT /device/{deviceId}/ports` by setting the `nativeVlanId` field on the target port.

---

#### GET `/vlan/{vlanId}` - Get a specific VLAN

```bash
curl -X GET \
  'https://core.hivelocity.net/api/v2/vlan/{vlanId}' \
  -H 'accept: application/json' \
  -H "X-API-KEY: $API_KEY"
```

Returns details for a single VLAN including its 802.1Q tag, facility, and list of member device IDs.

---

#### PUT `/vlan/{vlanId}` - Modify a VLAN

Add or remove devices from an existing VLAN, or update its configuration.

```bash
curl -X PUT \
  'https://core.hivelocity.net/api/v2/vlan/{vlanId}' \
  -H 'accept: application/json' \
  -H 'Content-Type: application/json' \
  -H "X-API-KEY: $API_KEY" \
  -d '{
    "device_ids": [11111, 22222]
  }'
```

---

#### DELETE `/vlan/{vlanId}` - Delete a VLAN

Permanently removes the VLAN. All devices currently on the VLAN will lose Layer 2 connectivity to each other through this VLAN.

```bash
curl -X DELETE \
  'https://core.hivelocity.net/api/v2/vlan/{vlanId}' \
  -H 'accept: application/json' \
  -H "X-API-KEY: $API_KEY"
```

---

### 3. Bonding - Rack-Aware NIC Aggregation

NIC bonding is a rack-level capability. Not all racks support bonding - it depends on the top-of-rack switch configuration. Bonding aggregates both NIC ports on a device into a single logical interface (`bond0`), providing redundancy and the ability to use both ports for Layer 2 and Layer 3 simultaneously.

---

#### Deploy to a bond-capable rack

When provisioning a bare metal server, you can require placement in a bond-capable rack:

```bash
curl -X POST \
  'https://core.hivelocity.net/api/v2/bare-metal-devices/' \
  -H 'Content-Type: application/json' \
  -H "X-API-KEY: $API_KEY" \
  -d '{
    "productId": 584,
    "locationName": "TPA1",
    "osName": "Ubuntu 22.x",
    "hostname": "server.example.com",
    "period": "hourly",
    "bondingSupport": true
  }'
```

---

#### POST `/device/{deviceId}/ports/bond` - Create the bond

See [Section 5](#5-layer-2-networking--ports--bonds) above for the full details and OS configuration steps required after the API call.

---

#### DELETE `/device/{deviceId}/ports/bond` - Break the bond

See [Section 5](#5-layer-2-networking--ports--bonds) above.

---

### 4. Facility & Rack Inventory

---

#### GET `/inventory/product` - Get available products by facility

Returns all server products (hardware configurations) available to your account, optionally grouped by facility. This shows which data centers (and implicitly, which racks) have inventory available.

```bash
curl -X GET \
  'https://core.hivelocity.net/api/v2/inventory/product?location=MAIN&group_by=facility' \
  -H 'accept: application/json' \
  -H "X-API-KEY: $API_KEY"
```

**Query parameters:**
- `group_by=facility` - group results by data center location
- `location` - filter to a specific region or facility code

**Stock values returned per product/facility combination:**
- `available` - plenty of servers in stock
- `limited` - low stock, may sell out
- `unavailable` - currently out of stock at that location

---

#### GET `/facility` - List all Hivelocity data centers

Returns all Hivelocity facilities (data centers) with their location codes, geographic locations, and feature flags.

```bash
curl -X GET \
  'https://core.hivelocity.net/api/v2/facility' \
  -H 'accept: application/json' \
  -H "X-API-KEY: $API_KEY"
```

---

## Endpoint Quick Reference Tables

### Device ID Endpoints

| Method | Endpoint | What it does | Device type |
|---|---|---|---|
| GET | `/device/{deviceId}` | Full device details (hostname, IPs, power state, rack info, tags) | All |
| PUT | `/device/{deviceId}` | Update hostname, custom name, tags | All |
| GET | `/device/{deviceId}/initial-creds` | Get initial SSH credentials (valid 7 days) | All |
| GET | `/device/{deviceId}/services` | List all services/add-ons on the device | All |
| POST | `/device/{deviceId}/power` | Power on / off / reboot | All |
| POST | `/device/{deviceId}/reload` | Trigger OS reload (must be powered off first) | Bare Metal |
| PUT | `/bare-metal-devices/{deviceId}` | Reload/update an instant bare metal device | Bare Metal |
| DELETE | `/bare-metal-devices/{deviceId}` | Permanently delete an instant bare metal server | Bare Metal |
| GET | `/device/{deviceId}/ipmi` | IPMI credentials for out-of-band access | Bare Metal |
| POST | `/device/{deviceId}/ipmi/whitelist` | Whitelist your IP for IPMI (12-hour window) | Bare Metal |
| GET | `/device/{deviceId}/ports` | List ports, IP assignments, VLAN, enabled state | All |
| PUT | `/device/{deviceId}/ports` | Set port IP assignments, enable/disable, VLAN | All |
| POST | `/device/{deviceId}/ports/bond` | Bond both NIC ports (bond-capable rack required) | Bare Metal |
| DELETE | `/device/{deviceId}/ports/bond` | Break the NIC bond back to separate ports | Bare Metal |
| POST | `/bandwidth/device/{deviceId}` | Get bandwidth time-series data for a device | All |
| GET | `/device/tags` | List all tags across your account's devices | All |
| GET | `/cancellation/reason/{deviceId}` | Get cancellation reason options for a device | All |
| POST | `/cancellation` | Submit a cancellation request | All |
| GET | `/vps/{deviceId}` | Get VPS instance details | VPS/VDS |
| PUT | `/vps/{deviceId}` | Upgrade VPS or update SSH keys | VPS/VDS |
| DELETE | `/vps/{deviceId}` | Permanently terminate the VPS | VPS/VDS |
| POST | `/vps/{deviceId}/console` | Get one-time browser console (KVM) URL | VPS/VDS |
| GET | `/vps/{deviceId}/events` | Get VPS event log | VPS/VDS |
| GET | `/vps/{deviceId}/metrics` | Get performance metric chart as Base64 image | VPS/VDS |
| PUT | `/vps/{deviceId}/reset-password` | Reset root password (must be powered off) | VPS/VDS |
| POST | `/vps/{deviceId}/attachiso` | Attach an ISO image to the VPS | VPS/VDS |
| POST | `/vps/{deviceId}/detachiso` | Detach the attached ISO from the VPS | VPS/VDS |
| POST | `/vps/{deviceId}/volume/{volumeId}/attach` | Attach a block storage volume to the VPS | VPS/VDS |
| POST | `/vps/{deviceId}/volume/{volumeId}/detach` | Detach a volume from the VPS | VPS/VDS |
| DELETE | `/vps/{deviceId}/network/{networkId}` | Detach a VPS network from the VPS | VPS/VDS |
| GET | `/vps/volume?deviceId={deviceId}` | List all volumes for a VPS | VPS/VDS |
| GET | `/vps/snapshotSchedule?deviceId={deviceId}` | List snapshot schedules for a VPS | VPS/VDS |

---

### Rack ID Endpoints

| Method | Endpoint | What it does | Notes |
|---|---|---|---|
| GET | `/device/{deviceId}` | Returns `rack_id` and `bonding_support` for the device | Rack context inside device |
| GET | `/vlan` | List all VLANs (includes rack/facility scope) | Account-wide |
| POST | `/vlan` | Create VLAN connecting devices in the same rack/facility | Supply `device_ids` |
| GET | `/vlan/{vlanId}` | Get details of a specific VLAN | |
| PUT | `/vlan/{vlanId}` | Modify VLAN - add/remove devices | |
| DELETE | `/vlan/{vlanId}` | Delete a VLAN | |
| POST | `/bare-metal-devices` | Deploy with `bondingSupport: true` to require a bond-capable rack | At provisioning time |
| POST | `/device/{deviceId}/ports/bond` | Bond NIC ports - only works in bond-capable racks | |
| DELETE | `/device/{deviceId}/ports/bond` | Break existing NIC bond | |
| GET | `/inventory/product?group_by=facility` | Available server products grouped by facility/rack location | |
| GET | `/facility` | List all data center facilities and their details | |

---

## Important Notes & Gotchas

**Reload safety:** A device must be fully powered off before an OS reload can be initiated. This is enforced by the API as a safety check - attempting a reload on a running device will be rejected.

**Data preservation on reload:** OS reloads destroy all data on the device. Hivelocity does not preserve the filesystem. If you need to save data, use the Backup / Rapid Restore service before reloading.

**Initial credentials expiry:** The `/device/{deviceId}/initial-creds` endpoint returns `null` for the password after 7 days. Set up your own SSH keys or authentication before this window closes.

**Bandwidth endpoint for billing:** Always use `POST /bandwidth/service/{serviceId}` for billing-accurate data. The device-based bandwidth endpoint (`/bandwidth/device/{deviceId}`) does not account for hardware replacement mid-billing-period.

**Port updates are full-state replacements:** `PUT /device/{deviceId}/ports` replaces the entire port state with what you send. Always include all existing fields you want to keep - omitting `ipAssignments` removes any existing subnet routing.

**VPS upgrades only:** VPS instances can only be upgraded to a larger product via `PUT /vps/{deviceId}`. Downgrading is not supported. The VPS must be powered off first.

**No standalone rack endpoint:** The Hivelocity public API does not expose a `/rack/{rackId}` resource. The `rack_id` in device details is informational. All rack-level operations flow through VLANs, bonding, and facility-scoped inventory.

**Bond-capable rack requirement:** NIC bonding is only available on devices deployed to bond-capable racks. Check `bonding_support` in the device details response. You can ensure a bond-capable rack at deployment time by passing `"bondingSupport": true` in the provisioning body.

**VPS power control:** Despite VPS having its own `/vps/{deviceId}` resource, power control (on/off/reboot) still goes through the shared `POST /device/{deviceId}/power` endpoint - not a VPS-specific one.

**Snapshot data for VPS:** Snapshot and snapshot schedule management uses the `deviceId` as a query parameter (`?deviceId=`), not as a path parameter. This means these are listed at the collection level (`/vps/snapshot`, `/vps/snapshotSchedule`) filtered by device - not nested under `/vps/{deviceId}/`.

---

*For the live interactive API reference, visit [developers.hivelocity.net/reference](https://developers.hivelocity.net/reference).*
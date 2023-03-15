# TPE-CLI

TPE-CLI is a Command Line Interface tool for managing Thingpark Enterprise devices. It provides a set of commands to interact with devices, gateways, routes, and connections in Thingpark Enterprise. With TPE-CLI, you can easily list devices, gateways, routes, and connections, and update devices with a CSV file.

## Installation

To install TPE-CLI, run the following command:

```
npm install -g tpe-cli
```

## Usage

### Login

To log in to Thingpark Enterprise, run the following command:

```
tpe-cli login
```

This will prompt you to enter your Thingpark Enterprise credentials.

### Device

#### List Devices

To list all devices in Thingpark Enterprise, run the following command:

```
tpe-cli device list
```

#### Update Devices

To update devices with a CSV file, run the following command:

```
tpe-cli device update --csv <csvPath>
```

Where `<csvPath>` is the path to your CSV file.

### Gateway

#### List Gateways

To list all gateways in Thingpark Enterprise, run the following command:

```
tpe-cli gateway list
```

### Route

#### List
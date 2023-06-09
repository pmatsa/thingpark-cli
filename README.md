# Thingpark Enterprise CLI

A CLI tool for managing ThingPark Enterprise devices.

## Installation

1. Clone the repository from GitHub: `git clone https://github.com/pmatsa/thingpark-cli.git`
2. Navigate to the project directory: `cd thingpark-cli`
3. Install dependencies: `npm install`
4. Link npm package: `npm link` (might need sudo)

## Commands

### Login

The login command allows you to authenticate your credentials with ThingPark Enterprise API.

```
tpx login
```

### Device

The device command allows you to manage devices in ThingPark Enterprise.

#### List Devices

The list command allows you to display a list of all devices in ThingPark Enterprise.

```
tpx device list
```

#### Update Devices

The update command allows you to update device information using a CSV file. The CSV file should contain the device EUIs and the fields to update.
Acceptable CSV headers: *['eui', 'name', 'geoLatitude', 'geoLongitude', 'routeRefs']*. When using *routeRefs*, the script looks for a seperator in the CSV (":" or ";") and creates routeRef array.

```
tpx device update --csv <csvPath>
```

### Gateway

The gateway command allows you to manage gateways in ThingPark Enterprise.

#### List Gateways

The list command allows you to display a list of all gateways in ThingPark Enterprise.

```
tpx gateway list
```

### Route

The route command allows you to manage routes in ThingPark Enterprise.

#### List Routes

The list command allows you to display a list of all routes in ThingPark Enterprise.

```
tpx route list
```

### Connection

The connection command allows you to manage connections in ThingPark Enterprise.

#### List Connections

The list command allows you to display a list of all connections in ThingPark Enterprise.

```
tpx connection list
```

## Contributing

Contributions are welcome! Please submit a pull request or open an issue if you would like to contribute to the project.

## License

This project is licensed under the ISC License. See the LICENSE file for more information.

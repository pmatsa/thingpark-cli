#!/usr/bin/env node

const { Command } = require('commander');
const loginAction = require('./actions/login');
//Device
const { listDevices } = require('./actions/device/list');
const { updateDevices } = require('./actions/device/update');
//Gateway
const { listGateways } = require('./actions/gateway/list');
//Route
const { listRoutes } = require('./actions/route/list');
//Connection
const { listConnections } = require('./actions/connection/list');

const program = new Command();
program.version('1.0.0');

program
  .command('login')
  .description('Log in to Thingpark Enterprise')
  .action(loginAction);

const deviceCommand = new Command('device').description('Device commands');
deviceCommand
  .command('list')
  .description('List devices')
  .action(listDevices);

deviceCommand
  .command('update')
  .requiredOption('-c, --csv <csvPath>', 'Update must have a CSV file path')
  .description('Update devices with a CSV file')
  .action((options) => updateDevices(options));
/*
deviceCommand
.command('add-route')
.option('--csv=<csv>', 'Path to CSV file')
.option('--route=<routeRef>', 'Route reference id')
.description('Add route to devices with a CSV file')
.action(addDeviceRoute);

deviceCommand
.command('delete')
.option('--csv=<csv>', 'Path to CSV file')
.description('Delete devices with a CSV file')
.action(deleteDevices);
*/

deviceCommand.on('command:*', function (operands) {
  console.error(`error: unknown command '${operands[0]}'`);
  const availableCommands = deviceCommand.commands.map((cmd) => cmd.name());
  console.log('Available commands: ', availableCommands.join(', '));
  process.exitCode = 1;
});

program.addCommand(deviceCommand);

const gatewayCommand = new Command('gateway').description('Gateway commands');
gatewayCommand
  .command('list')
  .description('List gateways')
  .action(listGateways);

gatewayCommand.on('command:*', function (operands) {
  console.error(`error: unknown command '${operands[0]}'`);
  const availableCommands = gatewayCommand.commands.map((cmd) => cmd.name());
  console.log('Available commands: ', availableCommands.join(', '));
  process.exitCode = 1;
});

program.addCommand(gatewayCommand);

const routeCommand = new Command('route').description('Route commands');
routeCommand
  .command('list')
  .description('List routes')
  .action(listRoutes);

routeCommand.on('command:*', function (operands) {
  console.error(`error: unknown command '${operands[0]}'`);
  const availableCommands = routeCommand.commands.map((cmd) => cmd.name());
  console.log('Available commands: ', availableCommands.join(', '));
  process.exitCode = 1;
});

program.addCommand(routeCommand);

const connectionCommand = new Command('connection').description('Connection commands');
connectionCommand
  .command('list')
  .description('List connections')
  .action(listConnections);

connectionCommand.on('command:*', function (operands) {
  console.error(`error: unknown command '${operands[0]}'`);
  const availableCommands = connectionCommand.commands.map((cmd) => cmd.name());
  console.log('Available commands: ', availableCommands.join(', '));
  process.exitCode = 1;
});

program.addCommand(connectionCommand);

program.parse(process.argv);
#!/usr/bin/env node

const { Command } = require('commander');
const loginAction = require('./actions/login');
//Device
const { listDevices } = require('./actions/device/list');
const { updateDevices } = require('./actions/device/update');
//Gateway
const { listGateways } = require('./actions/gateway/list');
//Route
const { listRoutes } = require('./actions/route');
//Connection
const { listConnections } = require('./actions/connection');

const program = new Command();
program.version('1.0.0');

program
  .command('login')
  .description('Log in to Thingpark Enterprise')
  .action(loginAction);

const deviceCommand = new Command('device');
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

const gatewayCommand = new Command('gateway');
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

program
  .command('route list')
  .description('List routes')
  .action(listRoutes);

program
  .command('connection list')
  .description('List connections')
  .action(listConnections);

program.parse(process.argv);
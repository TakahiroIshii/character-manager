import { AttributeType, BillingMode, Table } from "aws-cdk-lib/aws-dynamodb";
import { Construct } from "constructs";
import { Runtime } from "aws-cdk-lib/aws-lambda";
import { Inventory } from "../models/inventory";
import { keyMap, Keys, tableMap } from "../models/tableDecorator";
import {
  NodejsFunction,
  NodejsFunctionProps,
} from "aws-cdk-lib/aws-lambda-nodejs";
import { RemovalPolicy, Stack, StackProps } from "aws-cdk-lib";
import { LambdaRestApi } from "aws-cdk-lib/aws-apigateway";

const tableName = tableMap.get(Inventory)!;
const pk = keyMap.get(Inventory)!.get(Keys.PK)!;
const sk = keyMap.get(Inventory)!.get(Keys.SK)!;

export class CharacterManagerStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const functionProp: NodejsFunctionProps = {
      runtime: Runtime.NODEJS_14_X,
      memorySize: 1024,
    };

    const charactersHandler = new NodejsFunction(this, "charactersHandler", {
      entry: "lambda/charactersHandler.ts",
      ...functionProp,
    });

    const weaponsHandler = new NodejsFunction(this, "weaponsHandler", {
      entry: "lambda/weaponsHandler.ts",
      ...functionProp,
    });

    const inventoryHandler = new NodejsFunction(this, "inventoryHandler", {
      entry: "lambda/inventoryHandler.ts",
      ...functionProp,
    });

    const inventoryTable = new Table(this, "Inventory", {
      tableName: tableName,
      partitionKey: {
        name: pk,
        type: AttributeType.STRING,
      },
      sortKey: {
        name: sk,
        type: AttributeType.STRING,
      },
      billingMode: BillingMode.PAY_PER_REQUEST,
      removalPolicy: RemovalPolicy.DESTROY,
    });

    inventoryTable.grantReadWriteData(charactersHandler);
    inventoryTable.grantReadWriteData(weaponsHandler);
    inventoryTable.grantReadWriteData(inventoryHandler);

    const charactersAPI = new LambdaRestApi(this, "charactersAPI", {
      handler: charactersHandler,
      proxy: false,
    });

    const characters = charactersAPI.root.addResource("characters");

    // GET https://..../characters/playerId
    characters.addResource("all").addResource("{playerId}").addMethod("GET");

    // GET https://..../characters/character/playerId/characterId
    characters
      .addResource("character")
      .addResource("{playerId}")
      .addResource("{characterId}")
      .addMethod("GET");

    // POST https://..../characters/new/playerId/characterId
    characters
      .addResource("new")
      .addResource("{playerId}")
      .addResource("{characterDataId}")
      .addMethod("POST");

    const weaponsAPI = new LambdaRestApi(this, "weaponsAPI", {
      handler: weaponsHandler,
      proxy: false,
    });

    const weapons = weaponsAPI.root.addResource("weapons");

    // GET https://..../weapons/playerId
    weapons.addResource("all").addResource("{playerId}").addMethod("GET");

    // GET https://..../weapons/playerId/weaponId
    weapons
      .addResource("weapon")
      .addResource("{playerId}")
      .addResource("{weaponId}")
      .addMethod("GET");

    // POST https://..../weapons/new/playerId/weaponId
    weapons
      .addResource("new")
      .addResource("{playerId}")
      .addResource("{weaponDataId}")
      .addMethod("POST");

    const inventoryAPI = new LambdaRestApi(this, "inventoryAPI", {
      handler: inventoryHandler,
      proxy: false,
    });
    const inventory = inventoryAPI.root.addResource("inventory");

    // GET https://..../inventory/playerId
    inventory.addResource("{playerId}").addMethod("GET");

    // POST https://..../inventory/equip/playerId/characterId/weaponId
    inventory
      .addResource("equip")
      .addResource("{playerId}")
      .addResource("{characterId}")
      .addResource("{weaponId}")
      .addMethod("POST");

    // POST https://..../inventory/remove/playerId/characterId/weaponId
    inventory
      .addResource("remove")
      .addResource("{playerId}")
      .addResource("{characterId}")
      .addResource("{weaponId}")
      .addMethod("POST");
  }
}

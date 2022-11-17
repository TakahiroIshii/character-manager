import * as AWS from "aws-sdk";
import {
  APIGatewayProxyEvent,
  APIGatewayProxyHandler,
  APIGatewayProxyResult,
} from "aws-lambda";
import { keyMap, Keys, tableMap } from "../models/tableDecorator";
import { Inventory, Prefix, Weapon } from "../models/inventory";
import { DocumentClient } from "aws-sdk/clients/dynamodb";

const db = new AWS.DynamoDB.DocumentClient();

const tableName = tableMap.get(Inventory)!;
const pk = keyMap.get(Inventory)!.get(Keys.PK)!;
const sk = keyMap.get(Inventory)!.get(Keys.SK)!;

export const handler: APIGatewayProxyHandler = async ({
  httpMethod,
  path,
  pathParameters,
}: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const playerId = pathParameters!["playerId"];
  const weaponId = pathParameters!["weaponId"];
  const weaponDataId = pathParameters!["weaponDataId"];

  switch (httpMethod) {
    case "GET": {
      if (path.includes("all")) {
        return getAll(playerId!);
      }
      return get(playerId!, weaponId!);
    }
    case "POST": {
      return put(playerId!, weaponDataId!);
    }
    default: {
      return {
        statusCode: 500,
        body: JSON.stringify({
          message: `weapons only accept GET/POST method, you tried: ${httpMethod}`,
        }),
      };
    }
  }
};

async function getAll(playerId: Weapon["player_id"]) {
  const queryParam: DocumentClient.QueryInput = {
    TableName: tableName,
    KeyConditionExpression:
      "#player_id = :player_id and begins_with(#sk, :weapon_prefix)",
    ExpressionAttributeNames: {
      "#player_id": pk,
      "#sk": sk,
    },
    ExpressionAttributeValues: {
      ":player_id": playerId,
      ":weapon_prefix": Prefix.weapon,
    },
  };
  const result = await db.query(queryParam).promise();
  return {
    statusCode: 200,
    body: JSON.stringify(result.Items!),
  };
}

async function get(playerId: Weapon["player_id"], weaponId: Weapon["sk"]) {
  const getParam: DocumentClient.GetItemInput = {
    TableName: tableName,
    Key: {
      [pk]: playerId,
      [sk]: Prefix.weapon + weaponId,
    },
  };
  const result = await db.get(getParam).promise();
  return {
    statusCode: 200,
    body: result.Item!["weapon_name"],
  };
}

async function put(
  playerId: Weapon["player_id"],
  weaponDataId: Weapon["weapon_data_id"]
) {
  const putParams: DocumentClient.PutItemInput = {
    TableName: tableName,
    Item: {
      [pk]: playerId,
      [sk]: Prefix.weapon + weaponDataId,
      weapon_data_id: weaponDataId,
      weapon_name: "test_weapon",
      equippedOn: "none",
    },
  };
  await db.put(putParams).promise();
  return {
    statusCode: 200,
    body: "Done!",
  };
}

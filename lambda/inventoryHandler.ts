import * as AWS from "aws-sdk";
import {
  APIGatewayProxyEvent,
  APIGatewayProxyHandler,
  APIGatewayProxyResult,
} from "aws-lambda";
import { keyMap, Keys, tableMap } from "../models/tableDecorator";
import { Character, Inventory, Prefix } from "../models/inventory";
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
  const characterId = pathParameters!["characterId"];
  const weaponId = pathParameters!["weaponId"];

  switch (httpMethod) {
    case "GET": {
      return getAll(playerId!);
    }
    case "POST": {
      return equipOrRemove(
        playerId!,
        characterId!,
        weaponId!,
        path.includes("equip")
      );
    }
    default: {
      return {
        statusCode: 500,
        body: JSON.stringify({
          message: `inventory only accept GET/POST method, you tried: ${httpMethod}`,
        }),
      };
    }
  }
};

async function getAll(playerId: Inventory["player_id"]) {
  const queryParam: DocumentClient.QueryInput = {
    TableName: tableName,
    KeyConditionExpression: "#player_id = :player_id",
    ExpressionAttributeNames: {
      "#player_id": pk,
    },
    ExpressionAttributeValues: {
      ":player_id": playerId,
    },
  };
  const result = await db.query(queryParam).promise();
  return {
    statusCode: 200,
    body: JSON.stringify(result.Items!),
  };
}

async function equipOrRemove(
  playerId: Character["player_id"],
  characterId: Character["sk"],
  weaponId: Character["equipped"],
  equip: boolean
) {
  const characterUpdateParams: DocumentClient.TransactWriteItem = {
    Update: {
      TableName: tableName,
      Key: {
        [pk]: playerId,
        [sk]: Prefix.character + characterId,
      },
      ConditionExpression: "#equipped = :current",
      UpdateExpression: "SET #equipped = :weaponId",
      ExpressionAttributeNames: {
        "#equipped": "equipped",
      },
      ExpressionAttributeValues: {
        ":weaponId": equip ? weaponId : "none",
        ":current": equip ? "none" : weaponId,
      },
    },
  };
  const weaponUpdateParams: DocumentClient.TransactWriteItem = {
    Update: {
      TableName: tableName,
      Key: {
        [pk]: playerId,
        [sk]: Prefix.weapon + weaponId,
      },
      ConditionExpression: "#equippedOn = :current",
      UpdateExpression: "SET #equippedOn = :characterId",
      ExpressionAttributeNames: {
        "#equippedOn": "equippedOn",
      },
      ExpressionAttributeValues: {
        ":characterId": equip ? characterId : "none",
        ":current": equip ? "none" : characterId,
      },
    },
  };

  await db
    .transactWrite({
      TransactItems: [characterUpdateParams, weaponUpdateParams],
    })
    .promise();
  return {
    statusCode: 200,
    body: "Done!",
  };
}

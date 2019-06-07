import { Transactions } from "@arkecosystem/crypto";
import { TransactionTypes } from '@incentum/praxis-client';
import { 
    canonicalizeJson,
    GetContractFromActionPayload,
} from '@incentum/praxis-interfaces';
import ByteBuffer from "bytebuffer";
import { BaseTransaction } from "./BaseTransaction";

const { schemas } = Transactions;

export class ContractFromActionTransaction extends BaseTransaction {
    public static type = TransactionTypes.ContractFromAction as number;

    public static getSchema(): Transactions.schemas.TransactionSchema {
        return schemas.extend(schemas.transactionBaseSchema, {
            $id: "contractFromAction",
            required: ["asset"],
            properties: {
                type: { transactionType: ContractFromActionTransaction.type },
                amount: { bignumber: { minimum: 0, maximum: 0 } },
                asset: {
                    type: "object",
                    required: ["payload"],
                    properties: {
                        payload: {
                            type: "object",
                        },
                    },
                },
            },
        });
    }

    public serialize():  ByteBuffer {
      const { data } = this;
      const payload = data.asset.payload as GetContractFromActionPayload;  
      const payloadBytes = Buffer.from(canonicalizeJson(payload), "utf8");  
      const buffer = new ByteBuffer(payloadBytes.length, true);
      buffer.append(payloadBytes);
      return buffer;
  }

  public deserialize(buf:  ByteBuffer):  void {
    const { data } = this;
    const json = buf.buffer.toString("utf8");
    data.asset = {
        payload: JSON.parse(json)
    };
  }
}

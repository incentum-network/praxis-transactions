import { Transactions } from "@arkecosystem/crypto";
import { TransactionTypes } from '@incentum/praxis-client';
import { 
    canonicalizeJson,
    GetUnusedOutputsPayload,
} from '@incentum/praxis-interfaces';
import ByteBuffer from "bytebuffer";
import { BaseTransaction } from "./BaseTransaction";

const { schemas } = Transactions;

export class UnusedOutputsTransaction extends BaseTransaction {
    public static type = TransactionTypes.UnusedOutputs as number;

    public static getSchema(): Transactions.schemas.TransactionSchema {
        return schemas.extend(schemas.transactionBaseSchema, {
            $id: "unusedOutputs",
            required: ["asset"],
            properties: {
                type: { transactionType: UnusedOutputsTransaction.type },
                amount: { bignumber: { minimum: 0, maximum: 0 } },
                asset: {
                    type: "object",
                    required: ["payload"],
                    properties: {
                        payload: {
                            type: "object",
                            required: ["ledger"],
                            properties: {
                                properties: {
                                    ledger: {
                                        type: "string",
                                    },
                                },
                            },
                        },
                    },
                },
            },
        });
    }

    public serialize():  ByteBuffer {
        const { data } = this;
        const payload = data.asset.payload as GetUnusedOutputsPayload;  
        const payloadBytes = Buffer.from(canonicalizeJson(payload), "utf8"); 
        const buffer = new ByteBuffer(payloadBytes.length + 2, true);
        buffer.writeUint16(payloadBytes.length);
        buffer.append(payloadBytes, "hex");
        return buffer;
    }

  public deserialize(buf:  ByteBuffer):  void {
    const { data } = this;
    const jsonLength = buf.readUint16();
    const json = buf.readString(jsonLength)
    data.asset = {
        payload: JSON.parse(json)
    };
  }

}

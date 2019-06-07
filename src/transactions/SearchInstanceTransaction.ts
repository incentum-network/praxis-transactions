import { Transactions } from "@arkecosystem/crypto";
import { TransactionTypes } from '@incentum/praxis-client';
import { 
    canonicalizeJson,
    InstanceSearchPayload,
} from '@incentum/praxis-interfaces';
import ByteBuffer from "bytebuffer";
import { BaseTransaction } from "./BaseTransaction";

const { schemas } = Transactions;

export class SearchInstanceTransaction extends BaseTransaction {
    public static type = TransactionTypes.InstanceSearch as number;

    public static getSchema(): Transactions.schemas.TransactionSchema {
        return schemas.extend(schemas.transactionBaseSchema, {
            $id: "searchInstance",
            required: ["asset"],
            properties: {
                type: { transactionType: SearchInstanceTransaction.type },
                amount: { bignumber: { minimum: 0, maximum: 0 } },
                asset: {
                    type: "object",
                    required: ["payload"],
                    properties: {
                        payload: {
                            type: "object",
                            required: ["search"],
                            properties: {
                                search: {
                                    type: "string",
                                },
                            },
                        },
                    },
                },
            },
        });
    }

    public verify(): boolean {
        return true;
    }

    public serialize():  ByteBuffer {
        const { data } = this;
        const payload = data.asset.payload as InstanceSearchPayload;  
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

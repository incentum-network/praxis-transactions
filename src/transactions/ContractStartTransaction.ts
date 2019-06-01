import { app } from "@arkecosystem/core-container";
import { Logger } from "@arkecosystem/core-interfaces";
import { Transactions } from "@arkecosystem/crypto";
import { TransactionTypes } from '@incentum/praxis-client';
import { 
    canonicalizeJson,
    ContractStartPayload,
} from '@incentum/praxis-interfaces';
import ByteBuffer from "bytebuffer";

const { schemas } = Transactions;

export class ContractStartTransaction extends Transactions.Transaction {
    public static type = TransactionTypes.ContractStart as number;

    public static getSchema(): Transactions.schemas.TransactionSchema {
        ContractStartTransaction.logger.info('ContractStartTransaction: getSchema')
        return schemas.extend(schemas.transactionBaseSchema, {
            $id: "contractStart",
            required: ["asset"],
            properties: {
                type: { transactionType: ContractStartTransaction.type },
                amount: { bignumber: { minimum: 0, maximum: 0 } },
                asset: {
                    type: "object",
                    required: ["payload"],
                    properties: {
                        payload: {
                            type: "object",
                            required: ["action", "initialState"],
                            properties: {
                                action: {
                                    type: "object",
                                },
                                initialState: {
                                    type: "object",
                                },
                            },
                        },
                    },
                },
            },
        });
    }

    private static logger = app.resolvePlugin<Logger.ILogger>("logger");

    public verify(): boolean {
        return true;
    }

    public serialize():  ByteBuffer {
        const { data } = this;
        const payload = data.asset.payload as ContractStartPayload;  
        const payloadBytes = Buffer.from(canonicalizeJson(payload), "utf8"); 
        const buffer = new ByteBuffer(payloadBytes.length + 2, true);
        buffer.writeUint16(payloadBytes.length);
        buffer.append(payloadBytes, "hex");
        return buffer;
    }

    public deserialize(buf:  ByteBuffer):  void {
        const { data } = this;
        ContractStartTransaction.logger.info(`deserialize ContractStartTransaction ${buf}`)
        const jsonLength = buf.readUint16();
        const json = buf.readString(jsonLength)
        ContractStartTransaction.logger.info(`deserialize json ${json}`)
        data.asset = {
            payload: JSON.parse(json)
        };
    }
}

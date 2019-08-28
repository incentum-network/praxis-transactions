/*
 * Licensed to Incentum Ltd. under one or more contributor
 * license agreements. See the NOTICE file distributed with
 * this work for additional information regarding copyright
 * ownership. Incentum Ltd. licenses this file to you under
 * the Token Use License Version 1.0 and the Token Use
 * Clause (the "License"); you may not use this file except
 * in compliance with the License. You may obtain a copy of
 * the License at
 *
 *  https://github.com/incentum-network/tul/blob/master/LICENSE.md
 *  https://github.com/incentum-network/tul/blob/master/TUC.md
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

import { Transactions } from "@arkecosystem/crypto";
import { TransactionTypes } from '@incentum/praxis-client';
import { 
    canonicalizeJson,
    SaveSchemasPayload,
} from '@incentum/praxis-interfaces';
import ByteBuffer from "bytebuffer";
import { BaseTransaction } from "./BaseTransaction";

const { schemas } = Transactions;

export class SaveSchemasTransaction extends BaseTransaction {
    public static type = TransactionTypes.SaveSchemas as number;

    public static getSchema(): Transactions.schemas.TransactionSchema {
        return schemas.extend(schemas.transactionBaseSchema, {
            $id: "saveSchemas",
            required: ["asset"],
            properties: {
                type: { transactionType: SaveSchemasTransaction.type },
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

    public verify(): boolean {
        return true;
    }

    public serialize():  ByteBuffer {
        const { data } = this;
        const payload = data.asset.payload as SaveSchemasPayload;  
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

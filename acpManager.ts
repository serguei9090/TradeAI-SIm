import { type ChildProcess, spawn } from "node:child_process";
import fs from "node:fs";
import { Readable, Writable } from "node:stream";
import * as acp from "@agentclientprotocol/sdk";

class AcpHandler implements acp.Client {
	public currentReply = "";

	async sessionUpdate(params: acp.SessionNotification): Promise<void> {
		const update = params.update;
		if (
			update.sessionUpdate === "agent_message_chunk" &&
			update.content.type === "text"
		) {
			this.currentReply += update.content.text;
		}
	}

	async readTextFile(
		params: acp.ReadTextFileRequest,
	): Promise<acp.ReadTextFileResponse> {
		try {
			const content = fs.readFileSync(params.path, "utf-8");
			return { content };
		} catch (e: any) {
			return { content: `Error: ${e.message}` };
		}
	}

	async writeTextFile(
		params: acp.WriteTextFileRequest,
	): Promise<acp.WriteTextFileResponse> {
		fs.writeFileSync(params.path, params.content);
		return {};
	}

	async requestPermission(
		params: acp.RequestPermissionRequest,
	): Promise<acp.RequestPermissionResponse> {
		return {
			outcome: {
				outcome: "selected",
				optionId: params.options[0]?.optionId || "allow",
			},
		};
	}
}

export class AcpManager {
	private agentProcess: ChildProcess | null = null;
	private connection: acp.ClientSideConnection | null = null;
	private handler: AcpHandler;
	private sessionId: string | null = null;
	private initPromise: Promise<void> | null = null;

	constructor() {
		this.handler = new AcpHandler();
	}

	async startAndInitialize(): Promise<void> {
		if (this.connection && this.sessionId) return;
		if (this.initPromise) return this.initPromise;

		this.initPromise = (async () => {
			const npxCmd = process.platform === "win32" ? "npx.cmd" : "npx";
			this.agentProcess = spawn(npxCmd, ["gemini", "--experimental-acp"], {
				stdio: ["pipe", "pipe", "inherit"],
			});

			const input = Writable.toWeb(this.agentProcess.stdin as any);
			const output = Readable.toWeb(this.agentProcess.stdout as any) as any;

			const stream = acp.ndJsonStream(input, output);
			this.connection = new acp.ClientSideConnection(
				() => this.handler,
				stream,
			);

			await this.connection.initialize({
				protocolVersion: acp.PROTOCOL_VERSION,
				clientCapabilities: {
					fs: { readTextFile: true, writeTextFile: true },
				},
			});

			const session = await this.connection.newSession({
				cwd: process.cwd(),
				mcpServers: [],
			});

			this.sessionId = session.sessionId;
		})();

		await this.initPromise;
	}

	async prompt(message: string): Promise<string> {
		await this.startAndInitialize();

		if (!this.connection || !this.sessionId) {
			throw new Error("Not initialized");
		}

		this.handler.currentReply = "";

		await this.connection.prompt({
			sessionId: this.sessionId,
			prompt: [{ type: "text", text: message }],
		});

		return this.handler.currentReply || "No response";
	}

	async testConnection(): Promise<boolean> {
		await this.startAndInitialize();
		return !!this.sessionId;
	}

	kill() {
		if (this.agentProcess) {
			this.agentProcess.kill();
			this.agentProcess = null;
			this.connection = null;
			this.sessionId = null;
			this.initPromise = null;
		}
	}
}

export const acpManager = new AcpManager();

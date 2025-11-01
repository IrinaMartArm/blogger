export abstract class DomainEvent {
  readonly occurredOn: Date;

  protected constructor() {
    this.occurredOn = new Date();
  }

  abstract getName(): string;
}

import { Injectable, Logger, Type } from "@nestjs/common";
import { ModulesContainer } from "@nestjs/core";
import { InstanceWrapper } from "@nestjs/core/injector/instance-wrapper";

@Injectable()
export class ModuleExplorerService {
  private logger: Logger;
  constructor(private readonly modulesContainer: ModulesContainer) {
    this.logger = new Logger(ModuleExplorerService.name);
  }

  /**
   * Get all controllers from a specific module and its submodules.
   */
  getControllersFromModule(moduleName: string): Type<any>[] {
    const controllers: Type<any>[] = [];

    // Find the root module
    const rootModule = Array.from(this.modulesContainer.values()).find(
      (module) => module.metatype?.name === moduleName,
    );

    if (!rootModule) {
      this.logger.warn(`Root module ${moduleName} not found.`);
      return [];
    }

    const visitedModules = new Set<any>(); // Track visited modules
    this.collectControllers(rootModule, controllers, visitedModules);

    return controllers;
  }

  private collectControllers(
    module: any,
    controllers: Type<any>[],
    visitedModules: Set<any>,
  ) {
    if (visitedModules.has(module)) return; // Prevent infinite loop
    visitedModules.add(module);

    module.controllers.forEach((controller: InstanceWrapper<any>) => {
      if (
        controller.metatype &&
        !controllers.includes(controller.metatype as any)
      ) {
        controllers.push(controller.metatype as any);
      }
    });

    module.imports.forEach((subModule) => {
      this.collectControllers(subModule, controllers, visitedModules);
    });
  }
}

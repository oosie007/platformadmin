import { Injectable } from '@angular/core';
import { StudioCommand, StudioCommands } from '@canvas/commands';
import { AppContextService } from '@canvas/services';
@Injectable({
  providedIn: 'root',
})
/**
 * CatalystPolicyService
 */
export class CatalystPolicyService {
  constructor(
    private readonly _commands: StudioCommands,
    private _appContext: AppContextService
  ) {
    this.searchPoliciesHttpCommand = <StudioCommand>(
      this._appContext.get(
        'pages.productOverview.commands.searchPoliciesCommand'
      )
    );
    this.clearProductCacheHttpCommand = <StudioCommand>(
      this._appContext.get(
        'pages.productOverview.commands.clearProductCacheHttpCommand'
      )
    );
  }

  /**
   * search PoliciesHTTP command
   */
  searchPoliciesHttpCommand!: StudioCommand<{
    url: string;
    method: string;
    disableCache: boolean;
  }>;

  /**
   * clear Product Cache HttpCommand
   */
  clearProductCacheHttpCommand!: StudioCommand<{
    url: string;
    method: string;
    disableCache: boolean;
  }>;

  getPolicyCountForProduct(productId: string, version: string, region: string) {
    return this._commands.execute(
      {
        commandName: 'HttpCommand',
        parameter: {
          url: `${
            (<{ url: string }>this.searchPoliciesHttpCommand.parameter).url
          }/${productId}`,
          method: 'GET',
          disableCache: true,
          params: {
            version,
          },
          headers: {
            region,
          },
        },
      },
      {}
    );
  }

  clearProductCacheWithVersion(payload: any, region: string) {
    return this._commands.execute(
      {
        commandName: 'HttpCommand',
        parameter: {
          url: (<{ url: string }>this.clearProductCacheHttpCommand.parameter)
            .url,
          method: 'POST',
          disableCache: true,
          headers: {
            region,
          },
        },
      },
      payload,
      {}
    );
  }
}

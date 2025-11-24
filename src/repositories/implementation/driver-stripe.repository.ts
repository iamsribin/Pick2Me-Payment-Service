import { AppStripeDataSource } from '@/config/sql-db';
import { DriverStripe } from '@/entity/driver-sripe.entity';
import { TYPES } from '@/types/inversify-types';
import { SqlBaseRepository } from '@Pick2Me/shared/sql';
import { inject, injectable } from 'inversify';
import { Repository } from 'typeorm';

@injectable()
export class DriverStripeRepository extends SqlBaseRepository<DriverStripe> {
  constructor(@inject(TYPES.DriverStripeRepositoryToken) repo: Repository<DriverStripe>) {
    super(DriverStripe, AppStripeDataSource);
  }
}

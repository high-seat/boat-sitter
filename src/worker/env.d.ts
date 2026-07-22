/** Extra Worker bindings beyond the generated wrangler types. */
declare namespace Cloudflare {
  interface Env {
    /** Optional until `wrangler r2 bucket create boatstead-uploads` has been run. */
    UPLOADS?: R2Bucket;
  }
}

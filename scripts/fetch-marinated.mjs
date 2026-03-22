import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY // Use service role for admin access

const supabase = createClient(supabaseUrl, supabaseKey)

async function fetchAllProducts() {
  const { data, error } = await supabase
    .from('products')
    .select('id, name, image')

  if (error) {
    console.error('Error fetching products:', error)
    return
  }

  console.log(JSON.stringify(data, null, 2))
}

fetchAllProducts()

<?php
namespace App\Http\Controllers\Api\Admin;
use App\Http\Controllers\Controller;
use App\Models\Bundle;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
class BundleController extends Controller {
    public function index() {
        return response()->json(Bundle::with('courses:id,title,price')->get()->map(fn($b)=>$this->payload($b)));
    }
    public function store(Request $request) {
        $data = $this->validated($request);
        if ($request->hasFile('thumbnail')) $data['thumbnail'] = $request->file('thumbnail')->store('bundles','public');
        $ids = $data['course_ids'] ?? []; unset($data['course_ids']);
        $bundle = Bundle::create($data);
        if ($ids) $bundle->courses()->sync($ids);
        return response()->json(['message'=>'Bundle created.','bundle'=>$this->payload($bundle->load('courses'))],201);
    }
    public function update(int $id, Request $request) {
        $bundle = Bundle::findOrFail($id);
        $data = $this->validated($request);
        if ($request->hasFile('thumbnail')) {
            if ($bundle->thumbnail) Storage::disk('public')->delete($bundle->thumbnail);
            $data['thumbnail'] = $request->file('thumbnail')->store('bundles','public');
        }
        $ids = $data['course_ids'] ?? null; unset($data['course_ids']);
        $bundle->update($data);
        if ($ids !== null) $bundle->courses()->sync($ids);
        return response()->json(['message'=>'Bundle updated.','bundle'=>$this->payload($bundle->fresh()->load('courses'))]);
    }
    public function destroy(int $id) { Bundle::findOrFail($id)->delete(); return response()->json(['message'=>'Bundle deleted.']); }
    private function validated(Request $request): array {
        return $request->validate([
            'title'=>'required|string|max:255','description'=>'nullable|string',
            'price'=>'required|numeric|min:0','original_price'=>'nullable|numeric|min:0',
            'is_active'=>'nullable|boolean','thumbnail'=>'nullable|image|mimes:jpeg,png,jpg,gif,webp|max:2048',
            'course_ids'=>'nullable|array','course_ids.*'=>'exists:courses,id',
        ]);
    }
    private function payload(Bundle $b): array {
        return [
            'id'=>$b->id,'title'=>$b->title,'description'=>$b->description,
            'price'=>$b->price,'original_price'=>$b->original_price,
            'thumbnail_url'=>$b->thumbnail_url,'is_active'=>$b->is_active,
            'courses'=>$b->relationLoaded('courses')?$b->courses->map(fn($c)=>['id'=>$c->id,'title'=>$c->title,'price'=>$c->price])->toArray():[],
        ];
    }
}

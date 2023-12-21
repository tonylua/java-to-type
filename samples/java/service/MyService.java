@RestController
@RequestMapping("/ccc/")
@CrossOrigin(origin = {
  "http://*.foo.com"
});
public class FooController extends XXController {

  @Autowired
  private Xxx1 xxx1;

  /**
   * 查询所有
   * 
   * @return 
   */
   @GetMapping(value = "/findAll", ppp = PPPP.CC_C)
   public List<SomeCategory> findAll() 
  {
    return xxx;
  }
}
